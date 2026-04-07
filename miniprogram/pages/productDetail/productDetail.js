const { resolveMediaSource, resolveMediaList } = require('../../utils/mediaAssets')
const {
  isFavorited,
  toggleFavorite,
  recordFootprint,
} = require('../../utils/collectionStore')
const {
  formatCommerceMessage,
  mapProductForDisplay,
} = require('../../utils/commerce')

Page({
  data: {
    id: '',
    detail: null,
    favorited: false,
    quantity: 1,
    statusBarHeight: 20,
    favoriteIcon: '/images/icons/favorite-heart-outline.png',
    favoriteIconFilled: '/images/icons/favorite-heart-filled.png',
    text: {
      empty: '暂无商品数据',
      origin: '产地信息',
      price: '价格',
      sold: '销量',
      stock: '库存',
      highlights: '商品亮点',
      description: '商品介绍',
      gallery: '商品图集',
      quantity: '购买数量',
      addCart: '加入购物车',
      buyNow: '立即购买',
    },
  },

  onLoad(options) {
    this.initNavMetrics()
    const id = options.id || ''
    this.setData({ id })
    if (id) {
      this.loadDetail(id)
    }
  },

  onShow() {
    const { detail } = this.data
    if (detail && detail._id) {
      this.setData({
        favorited: isFavorited('product', detail._id),
      })
    }
  },

  initNavMetrics() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20,
      })
    } catch (error) {
      this.setData({
        statusBarHeight: 20,
      })
    }
  },

  async loadDetail(id) {
    wx.showLoading({ title: '加载中' })
    try {
      const db = wx.cloud.database()
      const res = await db.collection('products').doc(id).get()
      const detail = await this.normalizeDetail(res.data || null)
      const favorited = isFavorited('product', detail && detail._id)
      if (detail) {
        recordFootprint(this.buildCollectionRecord(detail))
      }
      this.setData({ detail, favorited })
    } catch (error) {
      console.error('[productDetail] load failed', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },

  async normalizeDetail(detail) {
    if (!detail) {
      return null
    }

    const cover = await resolveMediaSource(detail.cover, '/images/nav-mall.png')
    const gallery = await resolveMediaList(detail.gallery || [], cover)
    const tags = []
      .concat(Array.isArray(detail.categoryTags) ? detail.categoryTags : [])
      .concat(Array.isArray(detail.tags) ? detail.tags : [])
      .slice(0, 6)
    const regionText = [detail.province, detail.city, detail.district].filter(Boolean).join(' / ')
    const normalized = mapProductForDisplay(detail)

    return {
      ...detail,
      ...normalized,
      cover,
      gallery,
      tags,
      regionText,
      locationText: detail.locationName || regionText || '产地待补充',
      highlights: Array.isArray(detail.highlights) ? detail.highlights : [],
      descriptionText: detail.content || detail.summary || '',
    }
  },

  buildCollectionRecord(detail) {
    if (!detail) {
      return null
    }

    return {
      type: 'product',
      id: detail._id,
      title: detail.title,
      cover: detail.cover,
      city: detail.city || detail.province || detail.locationText,
      regionText: detail.regionText || detail.locationText,
      summary: detail.summary || detail.descriptionText,
      priceText: detail.priceText,
      metaText: detail.soldText,
      badgeText: '商品',
    }
  },

  changeQuantity(e) {
    const delta = Number(e.currentTarget.dataset.delta || 0)
    const detail = this.data.detail || {}
    const current = Number(this.data.quantity || 1)
    const max = Math.max(1, Number(detail.stock || 1))
    const next = Math.min(max, Math.max(1, current + delta))
    this.setData({ quantity: next })
  },

  async addToCart() {
    const { detail, quantity } = this.data
    if (!detail || !detail._id || !detail.isPurchasable) {
      wx.showToast({
        title: '当前商品暂不可下单',
        icon: 'none',
      })
      return
    }

    wx.showLoading({ title: '加入中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'productCart',
        data: {
          action: 'add',
          productId: detail._id,
          quantity,
          selected: true,
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: formatCommerceMessage(res.result && res.result.message, '加入购物车失败'),
          icon: 'none',
        })
        return
      }

      wx.showToast({
        title: '已加入购物车',
        icon: 'success',
      })
    } catch (error) {
      console.error('[productDetail] add to cart failed', error)
      wx.showToast({
        title: '加入购物车失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },

  toggleFavorite() {
    const { detail } = this.data
    if (!detail || !detail._id) {
      return
    }

    const favorited = toggleFavorite(this.buildCollectionRecord(detail))
    this.setData({ favorited })
    wx.showToast({
      title: favorited ? '已收藏' : '已取消收藏',
      icon: 'none',
    })
  },

  previewGallery(e) {
    const current = e.currentTarget.dataset.src
    const urls = (this.data.detail && this.data.detail.gallery) || []
    if (!current || !urls.length) {
      return
    }

    wx.previewImage({
      current,
      urls,
    })
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }

    wx.switchTab({
      url: '/pages/home/home',
    })
  },

  handleBuy() {
    const { detail, quantity } = this.data
    if (!detail || !detail._id || !detail.isPurchasable) {
      wx.showToast({
        title: '当前商品暂不可下单',
        icon: 'none',
      })
      return
    }

    wx.navigateTo({
      url: `/pages/confirmOrder/confirmOrder?source=buy_now&productId=${detail._id}&quantity=${quantity}`,
    })
  },

  goCart() {
    wx.switchTab({
      url: '/pages/cart/cart',
    })
  },
})
