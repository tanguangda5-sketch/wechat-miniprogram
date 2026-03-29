Page({
  data: {
    title: '',
    content: '',
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value || '' })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value || '' })
  },

  submitNote() {
    wx.showToast({
      title: '笔记发布能力后续接入',
      icon: 'none',
    })
  },
})
