const {
  getPlatformSupport,
  markPlatformSupportRead,
  sendPlatformSupportMessage,
  formatConversationTime,
} = require('../../utils/messageStore')

Page({
  data: {
    messages: [],
    inputValue: '',
  },

  onShow() {
    markPlatformSupportRead()
    this.refreshPage()
  },

  refreshPage() {
    const detail = getPlatformSupport()
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
    sendPlatformSupportMessage(text)
    this.setData({ inputValue: '' })
    this.refreshPage()
  },
})
