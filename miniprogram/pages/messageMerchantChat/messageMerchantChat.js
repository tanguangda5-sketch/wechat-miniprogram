const {
  getMerchantConversation,
  markMerchantConversationRead,
  sendMerchantMessage,
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
    markMerchantConversationRead(this.data.id)
    this.refreshPage()
  },

  refreshPage() {
    const detail = getMerchantConversation(this.data.id)
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
    sendMerchantMessage(this.data.id, text)
    this.setData({ inputValue: '' })
    this.refreshPage()
  },
})
