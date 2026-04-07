Page({
  data: {
    list: [],
    selectMode: false,
    loading: false,
  },

  onLoad(options) {
    this.setData({
      selectMode: options.select === '1',
    })
  },

  onShow() {
    this.loadList()
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'addressManage',
        data: {
          action: 'list',
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: (res.result && res.result.message) || '地址加载失败',
          icon: 'none',
        })
        return
      }

      this.setData({
        list: (res.result.data && res.result.data.list) || [],
      })
    } catch (error) {
      console.error('[addressList] load failed', error)
      wx.showToast({
        title: '地址加载失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  chooseAddress(e) {
    if (!this.data.selectMode) return
    const id = e.currentTarget.dataset.id
    const address = this.data.list.find((item) => item._id === id)
    if (!address) return

    const channel = this.getOpenerEventChannel()
    channel.emit('addressSelected', { address })
    wx.navigateBack()
  },

  goAdd() {
    wx.navigateTo({
      url: '/pages/addressEdit/addressEdit',
    })
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/addressEdit/addressEdit?id=${id}`,
    })
  },

  noop() {},

  async setDefault(e) {
    const id = e.currentTarget.dataset.id
    await this.runAction('setDefault', { id }, '已设为默认地址')
  },

  async removeAddress(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除地址',
      content: '确认删除这条收货地址吗？',
      success: async (res) => {
        if (!res.confirm) return
        await this.runAction('delete', { id }, '已删除')
      },
    })
  },

  async runAction(action, payload, successTitle) {
    wx.showLoading({ title: '处理中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'addressManage',
        data: {
          action,
          ...payload,
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: (res.result && res.result.message) || '操作失败',
          icon: 'none',
        })
        return
      }

      if (successTitle) {
        wx.showToast({
          title: successTitle,
          icon: 'success',
        })
      }
      await this.loadList()
    } catch (error) {
      console.error('[addressList] action failed', action, error)
      wx.showToast({
        title: '操作失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },
})
