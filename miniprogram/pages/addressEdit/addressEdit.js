Page({
  data: {
    id: '',
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    postalCode: '',
    isDefault: false,
    loading: false,
  },

  onLoad(options) {
    const id = options.id || ''
    this.setData({ id })
    if (id) {
      wx.setNavigationBarTitle({ title: '编辑地址' })
      this.loadDetail(id)
    } else {
      wx.setNavigationBarTitle({ title: '新增地址' })
    }
  },

  async loadDetail(id) {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'addressManage',
        data: {
          action: 'detail',
          id,
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: (res.result && res.result.message) || '地址加载失败',
          icon: 'none',
        })
        return
      }

      const address = (res.result.data && res.result.data.address) || {}
      this.setData({
        receiverName: address.receiverName || '',
        receiverPhone: address.receiverPhone || '',
        province: address.province || '',
        city: address.city || '',
        district: address.district || '',
        detailAddress: address.detailAddress || '',
        postalCode: address.postalCode || '',
        isDefault: !!address.isDefault,
      })
    } catch (error) {
      console.error('[addressEdit] load failed', error)
      wx.showToast({
        title: '地址加载失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value,
    })
  },

  onDefaultChange(e) {
    this.setData({
      isDefault: !!e.detail.value,
    })
  },

  async onSave() {
    const action = this.data.id ? 'update' : 'create'
    this.setData({ loading: true })
    wx.showLoading({ title: '保存中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'addressManage',
        data: {
          action,
          id: this.data.id,
          receiverName: this.data.receiverName,
          receiverPhone: this.data.receiverPhone,
          province: this.data.province,
          city: this.data.city,
          district: this.data.district,
          detailAddress: this.data.detailAddress,
          postalCode: this.data.postalCode,
          isDefault: this.data.isDefault,
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: (res.result && res.result.message) || '保存失败',
          icon: 'none',
        })
        return
      }

      wx.showToast({
        title: '已保存',
        icon: 'success',
      })
      setTimeout(() => wx.navigateBack(), 500)
    } catch (error) {
      console.error('[addressEdit] save failed', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
      wx.hideLoading()
    }
  },
})
