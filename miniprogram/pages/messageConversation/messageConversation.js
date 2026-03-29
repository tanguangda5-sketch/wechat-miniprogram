const {
  getFormalConversation,
  markFormalConversationRead,
  sendFormalMessage,
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
    markFormalConversationRead(this.data.id)
    this.refreshPage()
  },

  refreshPage() {
    const detail = getFormalConversation(this.data.id)
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
    sendFormalMessage(this.data.id, text)
    this.setData({ inputValue: '' })
    this.refreshPage()
  },
})
