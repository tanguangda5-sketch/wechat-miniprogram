const {
  formatCommerceMessage,
  formatFenToYuan,
  runProductOrderPayment,
} = require('../../utils/commerce')

function formatDateTime(input) {
  if (!input) return ''
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

Page({
  data: {
    id: '',
    detail: null,
    countdownText: '',
  },

  timer: null,

  onLoad(options) {
    this.setData({
      id: options.id || '',
    })
  },

  onShow() {
    this.loadDetail()
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  async loadDetail() {
    const id = this.data.id
    if (!id) return

    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'productOrder',
        data: {
          action: 'detail',
          id,
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: formatCommerceMessage(res.result && res.result.message, '??????'),
          icon: 'none',
        })
        return
      }

      const order = this.decorateOrder((res.result.data && res.result.data.order) || null)
      this.setData({ detail: order }, () => this.setupCountdown())
    } catch (error) {
      console.error('[productOrderDetail] load failed', error)
      wx.showToast({
        title: '订单加载失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },

  decorateOrder(order) {
    if (!order) return null
    return {
      ...order,
      goodsAmountText: formatFenToYuan(order.goodsAmount, { fallback: '￥0' }),
      shippingFeeText: order.shippingFee > 0 ? formatFenToYuan(order.shippingFee, { fallback: '￥0' }) : '包邮',
      payAmountText: formatFenToYuan(order.payAmount, { fallback: '￥0' }),
      createdAtText: formatDateTime(order.createdAt),
      paidAtText: formatDateTime(order.paidAt),
      shippedAtText: formatDateTime(order.shippedAt),
      items: (order.items || []).map((item) => ({
        ...item,
        unitPriceText: formatFenToYuan(item.unitPrice, { fallback: '￥0' }),
        subtotalText: formatFenToYuan(item.subtotal, { fallback: '￥0' }),
      })),
    }
  },

  setupCountdown() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    const detail = this.data.detail
    if (!detail || detail.displayStatusKey !== 'pending_payment') return

    const update = () => {
      const left = Number(detail.paymentDeadline || 0) - Date.now()
      if (left <= 0) {
        this.setData({ countdownText: '00:00' })
        clearInterval(this.timer)
        this.timer = null
        this.loadDetail()
        return
      }

      const minutes = Math.floor(left / 1000 / 60)
      const seconds = Math.floor((left / 1000) % 60)
      this.setData({
        countdownText: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      })
    }

    update()
    this.timer = setInterval(update, 1000)
  },

  async cancelOrder() {
    wx.showModal({
      title: '取消订单',
      content: '确认取消这笔待支付订单吗？',
      success: async (res) => {
        if (!res.confirm) return
        await this.runOrderAction('cancel', { id: this.data.id }, '已取消')
      },
    })
  },

  async payOrder() {
    const result = await runProductOrderPayment(this.data.id)
    if (!result.success) {
      wx.showToast({
        title: formatCommerceMessage(result.message, '????'),
        icon: 'none',
      })
      return
    }

    if (result.cancelled) {
      wx.showToast({
        title: '订单仍为待支付状态',
        icon: 'none',
      })
    } else {
      wx.showToast({
        title: '支付成功',
        icon: 'success',
      })
    }
    this.loadDetail()
  },

  async confirmReceive() {
    wx.showModal({
      title: '确认收货',
      content: '确认已经收到商品了吗？',
      success: async (res) => {
        if (!res.confirm) return
        await this.runOrderAction('confirmReceive', { id: this.data.id }, '已确认收货')
      },
    })
  },

  goOrderList() {
    wx.navigateTo({
      url: '/pages/productOrderList/productOrderList?tab=all',
    })
  },

  async runOrderAction(action, payload, successTitle) {
    wx.showLoading({ title: '处理中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'productOrder',
        data: {
          action,
          ...payload,
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: formatCommerceMessage(res.result && res.result.message, '????'),
          icon: 'none',
        })
        return
      }

      wx.showToast({
        title: successTitle,
        icon: 'success',
      })
      await this.loadDetail()
    } catch (error) {
      console.error('[productOrderDetail] action failed', action, error)
      wx.showToast({
        title: '操作失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },
})
