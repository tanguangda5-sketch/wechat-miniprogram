const { getPlatformGuarantees, formatConversationTime } = require('../../utils/messageStore')

Page({
  data: {
    list: [],
  },

  onShow() {
    this.setData({
      list: getPlatformGuarantees().map((item) => ({
        ...item,
        timeText: formatConversationTime(item.updatedAt),
      })),
    })
  },

  onAction() {
    wx.showToast({ title: '保障功能后续接真实服务链路', icon: 'none' })
  },
})
