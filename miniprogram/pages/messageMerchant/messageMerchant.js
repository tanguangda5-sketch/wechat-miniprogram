const { getMerchantConversations, formatConversationTime } = require('../../utils/messageStore')

Page({
  data: {
    list: [],
  },

  onShow() {
    this.setData({
      list: getMerchantConversations().map((item) => ({
        ...item,
        timeText: formatConversationTime(item.updatedAt),
        unreadText: item.unread > 99 ? '99+' : (item.unread > 0 ? String(item.unread) : ''),
      })),
    })
  },

  openChat(e) {
    wx.navigateTo({ url: `/pages/messageMerchantChat/messageMerchantChat?id=${e.currentTarget.dataset.id}` })
  },
})
