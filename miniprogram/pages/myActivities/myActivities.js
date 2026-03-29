function mapOrderMessage(message) {
  const messageMap = {
    ORDER_CANNOT_PAY: 'This order cannot be paid now',
  }
  return messageMap[message] || message || 'Action failed'
}

Page({
  data: {
    currentTab: 'all',
    rawList: [],
    displayList: [],
    emptyText: 'No activities yet',
  },

  onShow() {
    this.loadOrders()
  },

  noop() {},

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab }, () => this.buildDisplayList())
  },

  async loadOrders() {
    wx.showLoading({ title: 'Loading' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'activityOrder',
        data: { action: 'listMine', page: 1, pageSize: 100 },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({ title: mapOrderMessage(res.result && res.result.message), icon: 'none' })
        return
      }

      this.setData({ rawList: res.result.data || [] }, () => this.buildDisplayList())
    } catch (error) {
      console.error('[myActivities] load orders failed', error)
      wx.showToast({ title: 'Load failed', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  buildDisplayList() {
    const { currentTab, rawList } = this.data
    let list = []
    let emptyText = 'No activities yet'

    if (currentTab === 'all') list = rawList
    if (currentTab === 'pending_payment') {
      list = rawList.filter((item) => item.displayStatusKey === 'pending_payment')
      emptyText = 'No pending payments'
    }
    if (currentTab === 'upcoming') {
      list = rawList.filter((item) => item.displayStatusKey === 'upcoming')
      emptyText = 'No upcoming trips'
    }
    if (currentTab === 'pending_review') {
      list = rawList.filter((item) => item.displayStatusKey === 'pending_review')
      emptyText = 'No pending reviews'
    }
    if (currentTab === 'after_sale') {
      list = rawList.filter((item) => item.displayStatusKey === 'refunding' || item.displayStatusKey === 'cancelled')
      emptyText = 'No refund records'
    }

    this.setData({ displayList: list, emptyText })
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/activityOrderDetail/activityOrderDetail?id=${e.currentTarget.dataset.id}` })
  },

  async payOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: 'Mock payment',
      content: 'Confirm payment success?',
      success: async (modalRes) => {
        if (!modalRes.confirm) return
        wx.showLoading({ title: 'Paying' })
        try {
          const res = await wx.cloud.callFunction({
            name: 'activityOrder',
            data: { action: 'mockPay', id },
          })

          if (!res.result || !res.result.success) {
            wx.showToast({ title: mapOrderMessage(res.result && res.result.message), icon: 'none' })
            return
          }

          wx.showToast({ title: 'Paid', icon: 'success' })
          this.loadOrders()
        } catch (error) {
          console.error('[myActivities] pay order failed', error)
          wx.showToast({ title: 'Payment failed', icon: 'none' })
        } finally {
          wx.hideLoading()
        }
      },
    })
  },

  goReview(e) {
    wx.navigateTo({ url: `/pages/activityReview/activityReview?id=${e.currentTarget.dataset.id}` })
  },
})
