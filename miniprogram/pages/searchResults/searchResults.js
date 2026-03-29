const DEFAULT_ACTIVITY_COVER = "/images/activities/lz-yuzhong-strawberry-family-day.jpg"
const DEFAULT_HOTEL_COVER = "/images/nav-hotel.png"
const DEFAULT_PRODUCT_COVER = "/images/default-goods-image.png"
const RESULT_TABS = ["全部", "活动", "景点", "商品", "民宿"]
const SCENIC_HINT_REGEXP = /景|观|花海|草原|古村|漫游|摄影|观光|山野|湿地|牧场/
const PRODUCT_HINT_REGEXP = /美食|特产|礼盒|手作|百合|鲜货|米酒|伴手礼|乡味/

const { buildActivityCoverTags } = require("../../utils/activityCoverTags")
const { resolveActivityCover, resolveMediaSource } = require("../../utils/mediaAssets")

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase()
}

function normalizeTagArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function joinActivitySearchText(item) {
  return [
    item.title,
    item.summary,
    item.content,
    item.detail,
    item.locationName,
    item.province,
    item.city,
    item.district,
    item.transport,
    item.stay
  ]
    .concat(normalizeTagArray(item.tags))
    .concat(normalizeTagArray(item.travelModeTags))
    .concat(normalizeTagArray(item.playTags))
    .concat(normalizeTagArray(item.suitableGroups))
    .concat(normalizeTagArray(item.highlights))
    .concat(normalizeTagArray(item.itinerary))
    .join(" ")
    .toLowerCase()
}

async function mapActivityResult(item) {
  const region = [item.province, item.city, item.district].filter(Boolean).join(" · ")
  const price = Number(item.priceFrom || item.price || 0)
  const coverTagInfo = buildActivityCoverTags(item)

  return {
    id: item._id || item.id,
    sourceId: item._id || item.id,
    type: "activity",
    title: item.title || "农旅活动",
    region: region || item.locationName || "地点待补充",
    price: price ? `¥${price}起` : "价格待定",
    priceText: price ? `¥${price}` : "主题精选",
    soldText: item.traveledCount ? `${item.traveledCount}人已出行` : "",
    dayText: coverTagInfo.durationTag || "",
    tags: coverTagInfo.combinedTags,
    cover: await resolveActivityCover(item)
  }
}

async function mapScenicResult(item) {
  const region = [item.province, item.city, item.district].filter(Boolean).join(" · ")
  const tags = normalizeTagArray(item.playTags)
    .concat(normalizeTagArray(item.tags))
    .slice(0, 4)

  return {
    id: `scenic-${item._id || item.id}`,
    sourceId: item._id || item.id,
    type: "scenic",
    title: item.locationName || item.title || "乡村景点",
    region: region || item.locationName || "地点待补充",
    price: item.priceFrom || item.price ? `¥${item.priceFrom || item.price}起` : "可咨询",
    priceText: item.priceFrom || item.price ? `¥${item.priceFrom || item.price}` : "景点推荐",
    soldText: item.visitedCount ? `${item.visitedCount}人已到访` : "",
    tags: tags.length ? tags : ["景点"],
    cover: await resolveMediaSource(item.cover, DEFAULT_ACTIVITY_COVER)
  }
}

async function mapProductResult(item) {
  const region = [item.province, item.city, item.district].filter(Boolean).join(" · ")
  const tags = normalizeTagArray(item.categoryTags)
    .concat(normalizeTagArray(item.playTags))
    .concat(normalizeTagArray(item.tags))
    .slice(0, 4)

  return {
    id: `product-${item._id || item.id}`,
    sourceId: item._id || item.id,
    type: "product",
    title: item.title || "乡味好物",
    region: region || item.locationName || "产地待补充",
    price: item.priceFrom || item.price ? `¥${item.priceFrom || item.price}起` : "价格待定",
    priceText: item.priceFrom || item.price ? `¥${item.priceFrom || item.price}` : "主题精选",
    soldText: item.sold ? `${item.sold}人已购` : "",
    tags: tags.length ? tags : ["乡味特产"],
    cover: await resolveMediaSource(item.cover, DEFAULT_PRODUCT_COVER)
  }
}

async function mapHotelResult(item) {
  const region = [item.province, item.city, item.district].filter(Boolean).join(" · ")
  const price = Number(item.price || item.priceFrom || 0)
  const tags = normalizeTagArray(item.tags).slice(0, 4)

  return {
    id: item._id || item.id,
    sourceId: item._id || item.id,
    type: "hotel",
    title: item.name || item.title || "乡野民宿",
    region: region || item.address || "地点待补充",
    price: price ? `¥${price}/晚` : "价格待定",
    priceText: price ? `¥${price}` : "民宿推荐",
    soldText: item.bookedCount ? `${item.bookedCount}人已订` : "",
    tags: tags.length ? tags : ["民宿"],
    cover: await resolveMediaSource(item.cover, DEFAULT_HOTEL_COVER)
  }
}

Page({
  data: {
    statusBarHeight: 20,
    keyword: "",
    loading: false,
    resultTabs: RESULT_TABS,
    activeResultTab: 0,
    allResults: [],
    visibleResults: [],
    text: {
      search: "搜索",
      searchPlaceholder: "搜索你想找的内容",
      emptyResult: "没有找到更匹配的内容，试试换个关键词看看。",
      typeActivity: "活动",
      typeScenic: "景点",
      typeProduct: "商品",
      typeHotel: "民宿"
    }
  },

  onLoad(options) {
    this.initNavMetrics()
    const keyword = options && options.keyword ? decodeURIComponent(options.keyword) : ""
    this.setData({ keyword })
    if (keyword) {
      this.performSearch(keyword)
    }
  },

  initNavMetrics() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20
      })
    } catch (err) {
      this.setData({
        statusBarHeight: 20
      })
    }
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({
      url: "/pages/home/home"
    })
  },

  onKeywordInput(e) {
    this.setData({
      keyword: e.detail.value || ""
    })
  },

  submitSearch() {
    const keyword = (this.data.keyword || "").trim()
    if (!keyword) {
      return
    }
    this.performSearch(keyword)
  },

  async loadSearchSource() {
    if (this.searchSourceCache) {
      return this.searchSourceCache
    }

    const [activities, hotels, scenics, products] = await Promise.all([
      this.fetchActivities(),
      this.fetchHotels(),
      this.fetchScenics(),
      this.fetchProducts()
    ])

    this.searchSourceCache = {
      activities,
      hotels,
      scenics,
      products
    }
    return this.searchSourceCache
  },

  async performSearch(keyword) {
    this.setData({
      loading: true,
      keyword
    })

    wx.showLoading({ title: "搜索中" })

    try {
      const { activities, hotels, scenics, products } = await this.loadSearchSource()
      const [activityResults, scenicResults, productResults, hotelResults] = await Promise.all([
        this.filterActivityResults(activities, keyword),
        this.filterScenicResults(scenics, keyword),
        this.filterProductResults(products, keyword),
        this.filterHotelResults(hotels, keyword)
      ])

      const allResults = []
        .concat(activityResults)
        .concat(scenicResults)
        .concat(productResults)
        .concat(hotelResults)

      this.persistHistory(keyword)
      this.setData({
        loading: false,
        activeResultTab: 0,
        allResults,
        visibleResults: allResults
      })
    } catch (error) {
      console.error("[searchResults] performSearch failed", error)
      this.setData({
        loading: false,
        allResults: [],
        visibleResults: []
      })
      wx.showToast({
        title: "搜索失败",
        icon: "none"
      })
    } finally {
      wx.hideLoading()
    }
  },

  persistHistory(keyword) {
    const storageKey = "searchHistoryKeywords"
    const current = wx.getStorageSync(storageKey) || []
    const next = [keyword].concat(current.filter((item) => item !== keyword)).slice(0, 8)
    wx.setStorageSync(storageKey, next)
  },

  async fetchActivities() {
    const res = await wx.cloud.callFunction({
      name: "getactivities"
    })
    return res.result?.list || []
  },

  async fetchHotels() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection("hotels").where({ status: true }).get()
      return res.data || []
    } catch (error) {
      console.error("[searchResults] fetch hotels failed", error)
      return []
    }
  },

  async fetchScenics() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection("scenics").get()
      return res.data || []
    } catch (error) {
      console.error("[searchResults] fetch scenics failed", error)
      return []
    }
  },

  async fetchProducts() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection("products").get()
      return res.data || []
    } catch (error) {
      console.error("[searchResults] fetch products failed", error)
      return []
    }
  },

  async filterActivityResults(list, keyword) {
    const lowerKeyword = normalizeSearchText(keyword)
    return Promise.all((list || [])
      .filter((item) => joinActivitySearchText(item).includes(lowerKeyword))
      .map(mapActivityResult))
  },

  async filterScenicResults(list, keyword) {
    const lowerKeyword = normalizeSearchText(keyword)
    return Promise.all((list || [])
      .filter((item) => {
        const text = [
          item.title,
          item.summary,
          item.content,
          item.locationName,
          item.province,
          item.city,
          item.district
        ]
          .concat(normalizeTagArray(item.tags))
          .concat(normalizeTagArray(item.playTags))
          .concat(normalizeTagArray(item.suitableGroups))
          .join(" ")
          .toLowerCase()
        return SCENIC_HINT_REGEXP.test(text) && text.includes(lowerKeyword)
      })
      .map(mapScenicResult))
  },

  async filterProductResults(list, keyword) {
    const lowerKeyword = normalizeSearchText(keyword)
    return Promise.all((list || [])
      .filter((item) => {
        const text = [
          item.title,
          item.summary,
          item.content,
          item.locationName,
          item.province,
          item.city,
          item.district
        ]
          .concat(normalizeTagArray(item.tags))
          .concat(normalizeTagArray(item.categoryTags))
          .concat(normalizeTagArray(item.suitableGroups))
          .join(" ")
          .toLowerCase()
        return PRODUCT_HINT_REGEXP.test(text) && text.includes(lowerKeyword)
      })
      .map(mapProductResult))
  },

  async filterHotelResults(list, keyword) {
    const lowerKeyword = normalizeSearchText(keyword)
    return Promise.all((list || [])
      .filter((item) => {
        const merged = [
          item.name,
          item.title,
          item.summary,
          item.desc,
          item.description,
          item.address,
          item.province,
          item.city,
          item.district
        ]
          .concat(normalizeTagArray(item.tags))
          .join(" ")
          .toLowerCase()

        return merged.includes(lowerKeyword)
      })
      .map(mapHotelResult))
  },

  changeResultTab(e) {
    const index = Number(e.currentTarget.dataset.index)
    const typeMap = ["all", "activity", "scenic", "product", "hotel"]
    const type = typeMap[index]
    const visibleResults = type === "all"
      ? this.data.allResults
      : this.data.allResults.filter((item) => item.type === type)

    this.setData({
      activeResultTab: index,
      visibleResults
    })
  },

  openResultDetail(e) {
    const id = e.currentTarget.dataset.id
    const sourceId = e.currentTarget.dataset.sourceid
    const type = e.currentTarget.dataset.type
    const targetId = sourceId || id

    if ((type === "activity" || type === "scenic" || type === "product") && targetId) {
      const detailUrlMap = {
        activity: `/pages/activityDetail/activityDetail?id=${targetId}`,
        scenic: `/pages/scenicDetail/scenicDetail?id=${targetId}`,
        product: `/pages/productDetail/productDetail?id=${targetId}`
      }
      wx.navigateTo({ url: detailUrlMap[type] })
      return
    }

    if (type === "hotel") {
      wx.navigateTo({
        url: targetId
          ? `/pages/hotelDetail/hotelDetail?id=${targetId}`
          : "/pages/hotel/hotel"
      })
      return
    }

    wx.showToast({
      title: "该类型详情页还在完善",
      icon: "none"
    })
  }
})
