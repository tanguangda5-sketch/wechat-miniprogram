const db = wx.cloud.database()
const { resolveMediaSource } = require('../../utils/mediaAssets')
const { mapProductForDisplay } = require('../../utils/commerce')

const SAFE_PRODUCT_COVER = '/images/default-goods-image.png'

async function normalizeProduct(item = {}) {
  const cover = await resolveMediaSource(item.cover, SAFE_PRODUCT_COVER)
  const normalized = mapProductForDisplay({
    ...item,
    cover,
  })

  return {
    id: item._id || '',
    title: item.title || '未命名商品',
    cover,
    priceText: normalized.priceText,
    soldText: normalized.soldText,
    isPurchasable: normalized.isPurchasable,
    statusText: normalized.isPurchasable ? '\u53ef\u4e0b\u5355' : '\u6682\u4e0d\u53ef\u552e',
    statusClass: normalized.isPurchasable ? 'onSale' : 'offSale',
  }
}

Page({
  data: {
    goodsList: [],
  },

  onLoad() {
    this.loadRealProducts()
  },

  async loadRealProducts() {
    try {
      const res = await db.collection('products').limit(50).get()
      const goodsList = await Promise.all((res.data || []).map((item) => normalizeProduct(item)))
      this.setData({
        goodsList: goodsList.filter((item) => !!item.id),
      })
    } catch (error) {
      console.error('[mall] load real products failed', error)
      wx.showToast({
        title: '商品加载失败',
        icon: 'none',
      })
    }
  },

  goProductDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      wx.showToast({
        title: '商品详情暂未开放',
        icon: 'none',
      })
      return
    }

    wx.navigateTo({
      url: `/pages/productDetail/productDetail?id=${id}`,
    })
  },
})
