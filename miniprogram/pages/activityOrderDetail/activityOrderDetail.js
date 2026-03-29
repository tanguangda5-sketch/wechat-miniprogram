function mapOrderMessage(message) {
  const messageMap = {
    ORDER_CANNOT_PAY: 'This order cannot be paid now',
    ORDER_CANNOT_CANCEL: 'This order cannot be cancelled now',
    ORDER_CANNOT_REFUND: 'This order cannot request refund now',
    ORDER_NOT_FOUND: 'Order not found',
  }

  return messageMap[message] || message || 'Action failed'
}

Page({
  data: {
    id: '',
    detail: null,
    countdownText: '',
  },

  timer: null,

  onLoad(options) {
    this.setData({ id: options.id || '' })
    this.loadDetail()
  },

  onShow() {
    if (this.data.id) this.loadDetail()
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  async loadDetail() {
    const { id } = this.data
    if (!id) return

    wx.showLoading({ title: 'Loading' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'activityOrder',
        data: { action: 'detail', id },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({ title: mapOrderMessage(res.result && res.result.message), icon: 'none' })
        return
      }

      this.setData({ detail: res.result.data }, () => this.setupCountdown())
    } catch (error) {
      console.error('[activityOrderDetail] load failed', error)
      wx.showToast({ title: 'Load failed', icon: 'none' })
    } finally {
      wx.hideLoading()
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

  contactMerchant() {
    wx.showToast({ title: 'Merchant support is not ready', icon: 'none' })
  },

  contactPlatform() {
    wx.showToast({ title: 'Platform support is not ready', icon: 'none' })
  },

  runOrderAction(action, loadingTitle, successTitle) {
    const detail = this.data.detail
    if (!detail || !detail._id) return

    wx.showLoading({ title: loadingTitle })
    wx.cloud.callFunction({
      name: 'activityOrder',
      data: { action, id: detail._id },
    }).then((res) => {
      if (!res.result || !res.result.success) {
        wx.showToast({ title: mapOrderMessage(res.result && res.result.message), icon: 'none' })
        return
      }

      wx.showToast({ title: successTitle, icon: 'success' })
      this.setData({ detail: res.result.data }, () => this.setupCountdown())
      this.loadDetail()
    }).catch((error) => {
      console.error('[activityOrderDetail] action failed', action, error)
      wx.showToast({ title: 'Action failed', icon: 'none' })
    }).finally(() => {
      wx.hideLoading()
    })
  },

  cancelOrder() {
    wx.showModal({
      title: 'Cancel order',
      content: 'Confirm cancel this order?',
      success: (res) => {
        if (!res.confirm) return
        this.runOrderAction('cancel', 'Processing', 'Cancelled')
      },
    })
  },

  payOrder() {
    wx.showModal({
      title: 'Mock payment',
      content: 'Confirm payment success?',
      success: (res) => {
        if (!res.confirm) return
        this.runOrderAction('mockPay', 'Paying', 'Paid')
      },
    })
  },

  refundOrder() {
    wx.showModal({
      title: 'Refund request',
      content: 'Confirm refund request?',
      success: (res) => {
        if (!res.confirm) return
        this.runOrderAction('requestRefund', 'Submitting', 'Refund requested')
      },
    })
  },

  goReview() {
    const detail = this.data.detail || {}
    wx.navigateTo({ url: `/pages/activityReview/activityReview?id=${detail._id}` })
  },
})
