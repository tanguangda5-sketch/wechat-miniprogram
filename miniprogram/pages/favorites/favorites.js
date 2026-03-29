const {
  CATEGORY_ALL,
  CITY_ALL,
  TYPE_CONFIG,
  getFavorites,
  getFootprints,
  clearFootprints,
} = require('../../utils/collectionStore')

const TAB_FAVORITES = 'favorites'
const TAB_FOOTPRINTS = 'footprints'

const CATEGORY_OPTIONS = [
  { value: CATEGORY_ALL, label: '全部分类' },
  { value: 'activity', label: TYPE_CONFIG.activity.label },
  { value: 'product', label: TYPE_CONFIG.product.label },
  { value: 'scenic', label: TYPE_CONFIG.scenic.label },
  { value: 'hotel', label: TYPE_CONFIG.hotel.label },
  { value: 'knowledge', label: TYPE_CONFIG.knowledge.label },
]

function formatMonthDay(timestamp) {
  const date = new Date(Number(timestamp || 0))
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

function isSameDay(left, right) {
  const leftDate = new Date(Number(left || 0))
  const rightDate = new Date(Number(right || 0))
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  )
}

function buildDayLabel(timestamp) {
  if (isSameDay(timestamp, Date.now())) {
    return '今天'
  }
  return formatMonthDay(timestamp)
}

function filterByCategoryAndCity(list, category, city) {
  return (list || []).filter((item) => {
    const categoryMatched = category === CATEGORY_ALL || item.type === category
    const cityMatched = city === CITY_ALL || item.city === city
    return categoryMatched && cityMatched
  })
}

function buildCategoryList(sourceList) {
  const countMap = (sourceList || []).reduce((result, item) => {
    result[item.type] = (result[item.type] || 0) + 1
    return result
  }, {})

  return CATEGORY_OPTIONS.map((option) => ({
    ...option,
    count: option.value === CATEGORY_ALL
      ? (sourceList || []).length
      : (countMap[option.value] || 0),
  }))
}

function buildCityList(sourceList, category) {
  const categoryFiltered = filterByCategoryAndCity(sourceList, category, CITY_ALL)
  const countMap = categoryFiltered.reduce((result, item) => {
    const city = item.city || '未知城市'
    result[city] = (result[city] || 0) + 1
    return result
  }, {})

  const cityOptions = Object.keys(countMap)
    .sort((left, right) => countMap[right] - countMap[left] || left.localeCompare(right))
    .map((city) => ({
      value: city,
      label: city,
      count: countMap[city],
    }))

  return [
    {
      value: CITY_ALL,
      label: '全部城市',
      count: categoryFiltered.length,
    },
    ...cityOptions,
  ]
}

function groupFootprints(list) {
  const groups = []
  ;(list || []).forEach((item) => {
    const label = buildDayLabel(item.visitedAt)
    const currentGroup = groups[groups.length - 1]
    if (currentGroup && currentGroup.label === label) {
      currentGroup.items.push(item)
      return
    }

    groups.push({
      label,
      items: [item],
    })
  })
  return groups
}

function getOptionLabel(list, value, fallback) {
  const matched = (list || []).find((item) => item.value === value)
  return matched ? matched.label : fallback
}

function buildDisplayTags(item = {}) {
  const tags = []
  const pushTag = (value) => {
    const text = String(value || '').trim()
    if (!text || tags.includes(text)) {
      return
    }
    tags.push(text)
  }

  String(item.metaText || '')
    .split(/[|｜·•,，]/)
    .map((text) => text.trim())
    .filter(Boolean)
    .forEach(pushTag)

  pushTag(item.city)
  pushTag(item.author)

  String(item.regionText || '')
    .split(/[|｜·•,，]/)
    .map((text) => text.trim())
    .filter(Boolean)
    .forEach(pushTag)

  return tags.slice(0, 5)
}

function normalizeDisplayList(list) {
  return (list || []).map((item) => ({
    ...item,
    displayTags: buildDisplayTags(item),
  }))
}

Page({
  data: {
    statusBarHeight: 20,
    activeTab: TAB_FAVORITES,
    activeCategory: CATEGORY_ALL,
    activeCity: CITY_ALL,
    showCategoryPanel: false,
    showCityPanel: false,
    categoryOptions: [],
    cityOptions: [],
    activeCategoryLabel: '全部分类',
    activeCityLabel: '全部城市',
    list: [],
    groups: [],
    emptyText: '还没有收藏内容',
  },

  onShow() {
    this.initNavMetrics()
    this.refreshPage()
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

  refreshPage() {
    const sourceList = this.getCurrentSourceList(this.data.activeTab)
    const categoryOptions = buildCategoryList(sourceList)
    const nextCategory = categoryOptions.some((item) => item.value === this.data.activeCategory)
      ? this.data.activeCategory
      : CATEGORY_ALL
    const cityOptions = buildCityList(sourceList, nextCategory)
    const nextCity = cityOptions.some((item) => item.value === this.data.activeCity)
      ? this.data.activeCity
      : CITY_ALL
    const filteredList = normalizeDisplayList(filterByCategoryAndCity(sourceList, nextCategory, nextCity))

    this.setData({
      activeCategory: nextCategory,
      activeCity: nextCity,
      categoryOptions,
      cityOptions,
      activeCategoryLabel: getOptionLabel(categoryOptions, nextCategory, '全部分类'),
      activeCityLabel: getOptionLabel(cityOptions, nextCity, '全部城市'),
      list: this.data.activeTab === TAB_FAVORITES ? filteredList : [],
      groups: this.data.activeTab === TAB_FOOTPRINTS ? groupFootprints(filteredList) : [],
      emptyText: this.data.activeTab === TAB_FAVORITES ? '还没有收藏内容' : '还没有浏览记录',
      showCategoryPanel: false,
      showCityPanel: false,
    })
  },

  getCurrentSourceList(tab) {
    return tab === TAB_FOOTPRINTS ? getFootprints() : getFavorites()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab || tab === this.data.activeTab) {
      return
    }

    this.setData({
      activeTab: tab,
      activeCity: CITY_ALL,
      activeCategory: CATEGORY_ALL,
    }, () => this.refreshPage())
  },

  toggleCategoryPanel() {
    this.setData({
      showCategoryPanel: !this.data.showCategoryPanel,
      showCityPanel: false,
    })
  },

  toggleCityPanel() {
    this.setData({
      showCityPanel: !this.data.showCityPanel,
      showCategoryPanel: false,
    })
  },

  closePanels() {
    this.setData({
      showCategoryPanel: false,
      showCityPanel: false,
    })
  },

  selectCategory(e) {
    const value = e.currentTarget.dataset.value || CATEGORY_ALL
    this.setData({
      activeCategory: value,
      activeCity: CITY_ALL,
    }, () => this.refreshPage())
  },

  selectCity(e) {
    const value = e.currentTarget.dataset.value || CITY_ALL
    this.setData({
      activeCity: value,
    }, () => this.refreshPage())
  },

  openDetail(e) {
    const url = e.currentTarget.dataset.url
    if (!url) {
      return
    }

    wx.navigateTo({ url })
  },

  goEditFavorites() {
    wx.navigateTo({
      url: `/pages/favoritesEdit/favoritesEdit?category=${this.data.activeCategory}&city=${encodeURIComponent(this.data.activeCity)}`,
    })
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }

    wx.switchTab({
      url: '/pages/me/me',
    })
  },

  handleClearFootprints() {
    if (this.data.activeTab !== TAB_FOOTPRINTS) {
      return
    }

    wx.showModal({
      title: '清空浏览',
      content: '确认清空所有浏览吗？',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        clearFootprints()
        this.refreshPage()
        wx.showToast({
          title: '已清空',
          icon: 'success',
        })
      },
    })
  },

  noop() {},
})
