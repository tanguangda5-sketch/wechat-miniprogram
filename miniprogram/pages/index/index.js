Page({
  data: {
    list: [],
    loading: true
  },

  async onLoad() {
    await this.loadList()
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getactivities'
      })
      console.log('getactivities res:', res)

      this.setData({
        list: res.result.list || [],
        loading: false
      })
    } catch (e) {
      console.error(e)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  cardTap(e) {
    const id = e.currentTarget.dataset.id
    console.log('准备跳转详情 id=', id)
  
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
      success() {
        console.log('跳转成功')
      },
      fail(err) {
        console.error('跳转失败', err)
        wx.showToast({ title: '跳转失败', icon: 'none' })
      }
    })
  }
  
})
