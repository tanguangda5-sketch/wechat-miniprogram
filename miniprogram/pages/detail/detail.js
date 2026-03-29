function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

Page({

  data: {
    detail: null,
    loading: true
  },

  async onLoad(options) {
    const id = options.id

    if (!id) {
      wx.showToast({
        title: '缺少活动ID',
        icon: 'none'
      })
      return
    }

    await this.loadDetail(id)
  },

  async loadDetail(id) {
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getactivitydetail',
        data: { id }
      })

      let detail = res.result.detail || null

      // 格式化时间
      if (detail && detail.createdAt) {
        detail.createdAt = formatTime(detail.createdAt)
      }

      this.setData({
        detail,
        loading: false
      })

    } catch (e) {
      console.error(e)
      this.setData({ loading: false })

      wx.showToast({
        title: '加载详情失败',
        icon: 'none'
      })
    }
  }

})
