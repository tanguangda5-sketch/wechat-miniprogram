const {
  formatCommerceMessage,
  formatFenToYuan,
  runProductOrderPayment,
} = require('../../utils/commerce')

Page({
  data: {
    source: 'buy_now',
    productId: '',
    quantity: 1,
    preview: null,
    address: null,
    remark: '',
    submitting: false,
  },

  onLoad(options) {
    this.setData({
      source: options.source || 'buy_now',
      productId: options.productId || '',
      quantity: Number(options.quantity || 1),
    })
  },

  onShow() {
    this.loadPreview()
  },

  async loadPreview() {
    const data = {
      action: 'preview',
      source: this.data.source,
      addressId: this.data.address && this.data.address._id,
    }

    if (this.data.source === 'buy_now') {
      data.items = [
        {
          productId: this.data.productId,
          quantity: this.data.quantity,
        },
      ]
    }

    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'productOrder',
        data,
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: formatCommerceMessage(res.result && res.result.message, '??????'),
          icon: 'none',
        })
        return
      }

      const preview = res.result.data || {}
      this.setData({
        preview: this.decoratePreview(preview),
        address: preview.address || null,
      })
    } catch (error) {
      console.error('[confirmOrder] preview failed', error)
      wx.showToast({
        title: '订单预览失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },

  decoratePreview(preview = {}) {
    return {
      ...preview,
      goodsAmountText: formatFenToYuan(preview.goodsAmount, { fallback: '￥0' }),
      shippingFeeText: preview.shippingFee > 0 ? formatFenToYuan(preview.shippingFee, { fallback: '￥0' }) : '包邮',
      payAmountText: formatFenToYuan(preview.payAmount, { fallback: '￥0' }),
      items: (preview.items || []).map((item) => ({
        ...item,
        unitPriceText: formatFenToYuan(item.unitPrice, { fallback: '￥0' }),
        subtotalText: formatFenToYuan(item.subtotal, { fallback: '￥0' }),
      })),
    }
  },

  chooseAddress() {
    wx.navigateTo({
      url: '/pages/addressList/addressList?select=1',
      success: (res) => {
        res.eventChannel.on('addressSelected', ({ address }) => {
          this.setData({ address }, () => this.loadPreview())
        })
      },
    })
  },

  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value,
    })
  },

  async submitOrder() {
    if (this.data.submitting) return
    if (!this.data.address || !this.data.address._id) {
      wx.showToast({
        title: '请先选择收货地址',
        icon: 'none',
      })
      return
    }

    const payload = {
      action: 'create',
      source: this.data.source,
      addressId: this.data.address._id,
      remark: this.data.remark.trim(),
    }

    if (this.data.source === 'buy_now') {
      payload.items = [
        {
          productId: this.data.productId,
          quantity: this.data.quantity,
        },
      ]
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })
    try {
      const createRes = await wx.cloud.callFunction({
        name: 'productOrder',
        data: payload,
      })

      if (!createRes.result || !createRes.result.success) {
        wx.showToast({
          title: formatCommerceMessage(createRes.result && createRes.result.message, '????'),
          icon: 'none',
        })
        return
      }

      const order = (createRes.result.data && createRes.result.data.order) || null
      const orderId = order && order._id
      if (!orderId) {
        wx.showToast({
          title: '下单失败',
          icon: 'none',
        })
        return
      }

      const payResult = await runProductOrderPayment(orderId)
      if (!payResult.success) {
        wx.showToast({
          title: formatCommerceMessage(payResult.message, '??????'),
          icon: 'none',
        })
      }

      wx.redirectTo({
        url: `/pages/productOrderDetail/productOrderDetail?id=${orderId}`,
      })
    } catch (error) {
      console.error('[confirmOrder] create failed', error)
      wx.showToast({
        title: '下单失败',
        icon: 'none',
      })
    } finally {
      this.setData({ submitting: false })
      wx.hideLoading()
    }
  },
})
