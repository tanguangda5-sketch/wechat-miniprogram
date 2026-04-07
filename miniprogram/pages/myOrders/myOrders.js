const TAB_MAP = {
  all: '/pages/myActivities/myActivities?tab=all',
  pending_payment: '/pages/myActivities/myActivities?tab=pending_payment',
  pending_trip: '/pages/myActivities/myActivities?tab=upcoming',
  pending_receive: '/pages/myActivities/myActivities?tab=all',
  refund_after_sale: '/pages/myActivities/myActivities?tab=after_sale',
}

Page({
  data: {
    redirecting: false,
  },

  onLoad(options) {
    this.redirectToLegacyPage(options || {})
  },

  redirectToLegacyPage(options = {}) {
    if (this.data.redirecting) return
    const tab = options.tab || 'all'
    const url = TAB_MAP[tab] || TAB_MAP.all
    this.setData({ redirecting: true })

    wx.redirectTo({
      url,
      fail: () => {
        this.setData({ redirecting: false })
        wx.showToast({
          title: '打开订单页失败',
          icon: 'none',
        })
      },
    })
  },
})
