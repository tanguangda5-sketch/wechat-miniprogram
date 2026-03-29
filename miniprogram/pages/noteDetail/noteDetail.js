const { getNoteById, formatConversationTime } = require('../../utils/messageStore')

Page({
  data: {
    note: null,
  },

  onLoad(options) {
    const note = getNoteById(options.id || '')
    if (!note) {
      wx.showToast({
        title: '未找到笔记',
        icon: 'none',
      })
      return
    }

    this.setData({
      note: {
        ...note,
        timeText: formatConversationTime(note.publishAt),
      },
    })
  },
})
