const { getBuddyApplications, formatConversationTime } = require('../../utils/messageStore')

Page({
  data: {
    list: [],
  },

  onShow() {
    this.setData({
      list: getBuddyApplications().map((item) => ({
        ...item,
        timeText: formatConversationTime(item.updatedAt),
        unreadText: item.unread > 99 ? '99+' : (item.unread > 0 ? String(item.unread) : ''),
      })),
    })
  },

  openDetail(e) {
    wx.navigateTo({ url: `/pages/messageBuddyApplyChat/messageBuddyApplyChat?id=${e.currentTarget.dataset.id}` })
  },
})
