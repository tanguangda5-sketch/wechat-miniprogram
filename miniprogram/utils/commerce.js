const DEFAULT_PLATFORM_MERCHANT_OPENID = 'platform-self-operated'
const DEFAULT_PLATFORM_MERCHANT_NAME = '平台自营'
const DEFAULT_PRODUCT_STOCK = 100

function normalizeInt(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? Math.round(num) : fallback
}

function isLegacyYuanAmount(value) {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 && num < 1000
}

function normalizeAmountToFen(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) {
    return 0
  }

  if (!Number.isInteger(num) || isLegacyYuanAmount(num)) {
    return Math.round(num * 100)
  }

  return Math.round(num)
}

function formatFenToYuan(value, options = {}) {
  const { fallback = '待定', prefix = '￥' } = options
  const fen = normalizeInt(value, 0)
  if (fen <= 0) {
    return fallback
  }

  const yuan = (fen / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
  return `${prefix}${yuan}`
}

function formatCommerceMessage(message, fallback = '操作失败') {
  const map = {
    WECHAT_LOGIN_REQUIRED: '请先登录',
    PRODUCT_NOT_FOUND: '商品不存在',
    PRODUCT_OFF_SHELF: '商品已下架',
    PRODUCT_NOT_SETTLED: '当前商品暂不可下单',
    PRODUCT_STOCK_INSUFFICIENT: '库存不足',
    INVALID_QUANTITY: '商品数量不正确',
    EMPTY_ORDER_ITEMS: '请先选择商品',
    MERCHANT_MIX_NOT_ALLOWED: '暂不支持跨商家合并结算',
    ADDRESS_NOT_FOUND: '请先选择收货地址',
    ORDER_NOT_FOUND: '订单不存在',
    ORDER_CANNOT_CANCEL: '当前订单不可取消',
    ORDER_CANNOT_PAY: '当前订单不可支付',
    ORDER_EXPIRED: '订单已超时关闭',
    ORDER_CANNOT_CONFIRM_RECEIVE: '当前订单不可确认收货',
    PAYMENT_INIT_FAILED: '支付发起失败',
    PAYMENT_CONFIRM_FAILED: '支付确认失败',
    PAYMENT_MODE_UNSUPPORTED: '当前环境暂不支持该支付方式',
  }

  const normalized = normalizeText(message)
  return map[normalized] || normalized || fallback
}

function normalizeText(value = '') {
  return String(value || '').trim()
}

function normalizeProductCommerce(raw = {}) {
  const price = normalizeAmountToFen(raw.price)
  const shippingFee = normalizeAmountToFen(raw.shippingFee)
  const soldCount = Math.max(0, normalizeInt(raw.soldCount, normalizeInt(raw.sold, 0)))
  const lockedStock = Math.max(0, normalizeInt(raw.lockedStock, 0))
  const rawStock = normalizeInt(raw.stock, NaN)
  const stock = Number.isFinite(rawStock)
    ? Math.max(0, rawStock)
    : (price > 0 ? DEFAULT_PRODUCT_STOCK : 0)
  const merchantOpenid = normalizeText(raw.merchantOpenid) || DEFAULT_PLATFORM_MERCHANT_OPENID
  const merchantName = normalizeText(raw.merchantName) || DEFAULT_PLATFORM_MERCHANT_NAME

  let status = normalizeText(raw.status)
  if (!status) {
    status = price > 0 && stock > 0 ? 'on_sale' : 'draft'
  }

  const isPurchasable =
    status === 'on_sale' &&
    price > 0 &&
    stock > 0 &&
    !!normalizeText(raw.title) &&
    !!normalizeText(raw.cover) &&
    !!merchantOpenid &&
    !!merchantName

  return {
    price,
    shippingFee,
    soldCount,
    lockedStock,
    stock,
    merchantOpenid,
    merchantName,
    status,
    isPurchasable,
  }
}

function buildProductCommercePatch(raw = {}) {
  const normalized = normalizeProductCommerce(raw)
  const patch = {}

  if (normalizeAmountToFen(raw.price) !== Number(raw.price)) {
    patch.price = normalized.price
  }
  if (normalizeAmountToFen(raw.shippingFee) !== Number(raw.shippingFee || 0)) {
    patch.shippingFee = normalized.shippingFee
  }
  if (normalizeText(raw.merchantOpenid) !== normalized.merchantOpenid) {
    patch.merchantOpenid = normalized.merchantOpenid
  }
  if (normalizeText(raw.merchantName) !== normalized.merchantName) {
    patch.merchantName = normalized.merchantName
  }
  if (normalizeInt(raw.stock, NaN) !== normalized.stock) {
    patch.stock = normalized.stock
  }
  if (normalizeInt(raw.lockedStock, 0) !== normalized.lockedStock) {
    patch.lockedStock = normalized.lockedStock
  }
  if (normalizeInt(raw.soldCount, normalizeInt(raw.sold, 0)) !== normalized.soldCount) {
    patch.soldCount = normalized.soldCount
  }
  if (normalizeText(raw.status) !== normalized.status) {
    patch.status = normalized.status
  }

  return patch
}

function mapProductForDisplay(raw = {}) {
  const normalized = normalizeProductCommerce(raw)
  return {
    ...raw,
    ...normalized,
    priceText: formatFenToYuan(normalized.price),
    shippingFeeText: normalized.shippingFee > 0 ? formatFenToYuan(normalized.shippingFee) : '包邮',
    soldText: normalized.soldCount > 0 ? `已售 ${normalized.soldCount} 件` : '新品上架',
    stockText: normalized.stock > 0 ? `剩余 ${normalized.stock} 件` : '已售罄',
  }
}

function callProductOrderAction(data = {}) {
  return wx.cloud.callFunction({
    name: 'productOrder',
    data,
  })
}

async function runProductOrderPayment(orderId) {
  const initRes = await callProductOrderAction({
    action: 'createPayment',
    id: orderId,
  })

  if (!initRes.result || !initRes.result.success) {
    return {
      success: false,
      message: (initRes.result && initRes.result.message) || 'PAYMENT_INIT_FAILED',
    }
  }

  const paymentMode = (initRes.result.data && initRes.result.data.paymentMode) || 'mock'
  if (paymentMode !== 'mock') {
    return {
      success: false,
      message: 'PAYMENT_MODE_UNSUPPORTED',
    }
  }

  const confirmed = await new Promise((resolve) => {
    wx.showModal({
      title: '模拟支付',
      content: '当前环境未接入真实微信支付，是否确认模拟支付成功？',
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false),
    })
  })

  if (!confirmed) {
    return {
      success: true,
      cancelled: true,
      order: (initRes.result.data && initRes.result.data.order) || null,
    }
  }

  const confirmRes = await callProductOrderAction({
    action: 'createPayment',
    id: orderId,
    confirmMock: true,
  })

  if (!confirmRes.result || !confirmRes.result.success) {
    return {
      success: false,
      message: (confirmRes.result && confirmRes.result.message) || 'PAYMENT_CONFIRM_FAILED',
    }
  }

  return {
    success: true,
    cancelled: false,
    order: (confirmRes.result.data && confirmRes.result.data.order) || null,
  }
}

module.exports = {
  DEFAULT_PLATFORM_MERCHANT_OPENID,
  DEFAULT_PLATFORM_MERCHANT_NAME,
  DEFAULT_PRODUCT_STOCK,
  formatCommerceMessage,
  normalizeAmountToFen,
  normalizeInt,
  normalizeProductCommerce,
  buildProductCommercePatch,
  formatFenToYuan,
  mapProductForDisplay,
  runProductOrderPayment,
}
