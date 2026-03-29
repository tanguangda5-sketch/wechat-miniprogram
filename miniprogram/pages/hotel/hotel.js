const db = wx.cloud.database()
const SAFE_HOTEL_COVER = '/images/nav-hotel.png'

function normalizeCover(src = '') {
  return String(src || '').trim() || SAFE_HOTEL_COVER
}

function normalizeText(value = '') {
  return String(value || '').trim()
}

function trimRegionSuffix(name = '') {
  return normalizeText(name)
    .replace(/(特别行政区|自治区|地区|盟)$/u, '')
    .replace(/(省|市|区|县)$/u, '')
}

function getDisplayCity(source) {
  if (!source) {
    return '兰州'
  }

  const city = trimRegionSuffix(source.city)
  const district = trimRegionSuffix(source.district)
  const province = trimRegionSuffix(source.province)
  const displayName = trimRegionSuffix(source.displayName || source.label || '')
  return city || district || province || displayName || '兰州'
}

Page({
  data: {
    locationCity: '兰州',
    hotelList: [],
  },

  onLoad() {
    this.syncLocationCity()
    this.loadHotels()
  },

  onShow() {
    this.syncLocationCity()
  },

  syncLocationCity() {
    const app = getApp()
    const userInfo = app.getUserInfo ? app.getUserInfo() : null
    const selectedRegion = wx.getStorageSync('selectedRegion') || null

    this.setData({
      locationCity: getDisplayCity(selectedRegion || userInfo),
    })
  },

  async loadHotels() {
    try {
      const res = await db.collection('hotels')
        .where({ status: true })
        .orderBy('sort', 'asc')
        .get()

      const hotelList = (res.data || []).map((item) => ({
        ...item,
        sourceType: item.sourceType || 'demo',
        cover: normalizeCover(item.cover),
      }))

      this.setData({
        hotelList,
      })
    } catch (err) {
      console.error('load hotels failed', err)
      wx.showToast({
        title: '加载酒店失败',
        icon: 'none',
      })
    }
  },
  openHotelDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    wx.navigateTo({
      url: `/pages/hotelDetail/hotelDetail?id=${id}`,
    })
  },
})
