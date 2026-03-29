const {
  getBuddyApplication,
  markBuddyApplicationRead,
  replyToBuddyApplication,
  formatConversationTime,
} = require('../../utils/messageStore')

Page({
  data: {
    id: '',
    messages: [],
    inputValue: '',
  },

  onLoad(options) {
    this.setData({ id: options.id || '' })
  },

  onShow() {
    markBuddyApplicationRead(this.data.id)
    this.refreshPage()
  },

  refreshPage() {
    const detail = getBuddyApplication(this.data.id)
    if (!detail) {
      wx.showToast({ title: '申请已转入正式会话', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 200)
      return
    }
    this.setData({
      messages: (detail.messages || []).map((item) => ({
        ...item,
        timeText: formatConversationTime(item.updatedAt),
      })),
    })
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value || '' })
  },

  sendMessage() {
    const text = (this.data.inputValue || '').trim()
    if (!text) return
    const result = replyToBuddyApplication(this.data.id, text)
    if (!result.conversationId) return
    this.setData({ inputValue: '' })
    wx.redirectTo({ url: `/pages/messageConversation/messageConversation?id=${result.conversationId}` })
  },
})
