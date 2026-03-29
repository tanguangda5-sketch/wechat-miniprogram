const db = wx.cloud.database()
const app = getApp()

function getCurrentOpenid() {
  const userInfo = app.getUserInfo ? app.getUserInfo() : null
  return (userInfo && userInfo.openid) || ''
}

Page({
  data: {
    need: 0,
    list: [],
    selectedIds: [],
    isSelectedMap: {},
    footerText: '',
    footerEnabled: false,
  },

  onLoad(options) {
    const need = Number(options.need || 0)
    this.setData({ need })

    const ch = this.getOpenerEventChannel()
    ch.on('initSelected', ({ selectedIds }) => {
      const ids = Array.isArray(selectedIds) ? selectedIds : []
      this.setSelected(ids)
    })
  },

  onShow() {
    this.loadList()
  },

  async loadList() {
    const openid = getCurrentOpenid()
    if (!openid) {
      wx.showToast({ title: 'Please login first', icon: 'none' })
      return
    }

    wx.showLoading({ title: 'Loading' })
    try {
      const res = await db.collection('travelers')
        .where({ ownerOpenid: openid })
        .orderBy('updatedAt', 'desc')
        .orderBy('createdAt', 'desc')
        .get()

      this.setData({ list: res.data || [] }, () => this.updateFooter())
    } catch (error) {
      console.error('[travelerSelect] load list failed', error)
      wx.showToast({ title: 'Load failed', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  setSelected(ids) {
    const map = {}
    ids.forEach((id) => { map[id] = true })
    this.setData({
      selectedIds: ids,
      isSelectedMap: map,
    }, () => this.updateFooter())
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id
    const { need } = this.data
    const ids = this.data.selectedIds.slice()
    const index = ids.indexOf(id)

    if (index >= 0) {
      ids.splice(index, 1)
      this.setSelected(ids)
      return
    }

    if (ids.length >= need) {
      wx.showToast({ title: `Select up to ${need} travelers`, icon: 'none' })
      return
    }

    ids.push(id)
    this.setSelected(ids)
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/travelerEdit/travelerEdit' })
  },

  onEdit(e) {
    wx.navigateTo({ url: `/pages/travelerEdit/travelerEdit?id=${e.currentTarget.dataset.id}` })
  },

  updateFooter() {
    const { need, selectedIds } = this.data
    const selected = selectedIds.length
    const left = need - selected

    let footerText = ''
    let footerEnabled = false

    if (need <= 0) {
      footerText = 'Done'
      footerEnabled = true
    } else if (selected === 0) {
      footerText = `Select ${need} travelers`
    } else if (left > 0) {
      footerText = `${left} travelers remaining`
    } else {
      footerText = 'Done'
      footerEnabled = true
    }

    this.setData({ footerText, footerEnabled })
  },

  onDone() {
    if (!this.data.footerEnabled) return
    const ids = this.data.selectedIds
    const travelers = this.data.list.filter((item) => ids.includes(item._id))
    const ch = this.getOpenerEventChannel()
    ch.emit('selectedDone', { travelers })
    wx.navigateBack()
  },
})
