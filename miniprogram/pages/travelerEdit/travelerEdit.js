const db = wx.cloud.database()
const app = getApp()

function getCurrentOpenid() {
  const userInfo = app.getUserInfo ? app.getUserInfo() : null
  return (userInfo && userInfo.openid) || ''
}

function isOwnedByCurrentUser(record) {
  const openid = getCurrentOpenid()
  if (!openid || !record) return false
  return record.ownerOpenid === openid || record.openid === openid || record._openid === openid
}

Page({
  data: {
    id: '',
    idTypes: [
      'Identity Card',
      'Passport',
      'Military ID',
      'Home Return Permit',
      'Taiwan Compatriot Permit',
      'HK/Macau Permit',
      'Mainland Travel Permit',
      'Other',
    ],
    idTypeIndex: 0,
    name: '',
    idNo: '',
  },

  onLoad(options) {
    const id = options.id || ''
    if (id) {
      this.setData({ id })
      wx.setNavigationBarTitle({ title: 'Edit Traveler' })
      this.loadDetail(id)
    }
  },

  async loadDetail(id) {
    wx.showLoading({ title: 'Loading' })
    try {
      const res = await db.collection('travelers').doc(id).get()
      const detail = res.data || null

      if (!isOwnedByCurrentUser(detail)) {
        wx.showToast({ title: 'Traveler not found', icon: 'none' })
        return
      }

      const idx = this.data.idTypes.indexOf(detail.idType || 'Identity Card')
      this.setData({
        name: detail.name || '',
        idNo: detail.idNo || '',
        idTypeIndex: idx >= 0 ? idx : 0,
      })
    } catch (error) {
      console.error('[travelerEdit] load detail failed', error)
      wx.showToast({ title: 'Load failed', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  onName(e) { this.setData({ name: e.detail.value }) },
  onIdNo(e) { this.setData({ idNo: e.detail.value }) },
  onIdType(e) { this.setData({ idTypeIndex: Number(e.detail.value) }) },

  async onSave() {
    const { id, name, idNo, idTypes, idTypeIndex } = this.data
    const openid = getCurrentOpenid()

    if (!openid) {
      wx.showToast({ title: 'Please login first', icon: 'none' })
      return
    }
    if (!name.trim()) {
      wx.showToast({ title: 'Name is required', icon: 'none' })
      return
    }
    if (!idNo.trim()) {
      wx.showToast({ title: 'ID number is required', icon: 'none' })
      return
    }

    const payload = {
      name: name.trim(),
      idType: idTypes[idTypeIndex],
      idNo: idNo.trim(),
      ownerOpenid: openid,
      openid,
      updatedAt: new Date(),
    }

    wx.showLoading({ title: 'Saving' })
    try {
      if (id) {
        const detailRes = await db.collection('travelers').doc(id).get()
        if (!isOwnedByCurrentUser(detailRes.data)) {
          wx.showToast({ title: 'Traveler not found', icon: 'none' })
          return
        }
        await db.collection('travelers').doc(id).update({ data: payload })
      } else {
        await db.collection('travelers').add({
          data: {
            ...payload,
            createdAt: new Date(),
          },
        })
      }

      wx.showToast({ title: 'Saved', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 600)
    } catch (error) {
      console.error('[travelerEdit] save failed', error)
      wx.showToast({ title: 'Save failed', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
})
