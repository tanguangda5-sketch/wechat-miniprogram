const {
  CATEGORY_ALL,
  CITY_ALL,
  TYPE_CONFIG,
  getFavorites,
  deleteFavorites,
} = require('../../utils/collectionStore')

const CATEGORY_OPTIONS = [
  { value: CATEGORY_ALL, label: '全部分类' },
  { value: 'activity', label: TYPE_CONFIG.activity.label },
  { value: 'product', label: TYPE_CONFIG.product.label },
  { value: 'scenic', label: TYPE_CONFIG.scenic.label },
  { value: 'hotel', label: TYPE_CONFIG.hotel.label },
  { value: 'knowledge', label: TYPE_CONFIG.knowledge.label },
]

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

function attachSelectedState(list, selectedKeys) {
  const selectedKeySet = new Set(selectedKeys || [])
  return (list || []).map((item) => ({
    ...item,
    displayTags: buildDisplayTags(item),
    selected: selectedKeySet.has(item.key),
  }))
}

Page({
  data: {
    statusBarHeight: 20,
    activeCategory: CATEGORY_ALL,
    activeCity: CITY_ALL,
    categoryOptions: [],
    cityOptions: [],
    activeCategoryLabel: '全部分类',
    activeCityLabel: '全部城市',
    showCategoryPanel: false,
    showCityPanel: false,
    list: [],
    selectedKeys: [],
    allSelected: false,
  },

  onLoad(options = {}) {
    this.initNavMetrics()
    this.initialCategory = options.category || CATEGORY_ALL
    this.initialCity = options.city ? decodeURIComponent(options.city) : CITY_ALL
  },

  onShow() {
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
    const sourceList = getFavorites()
    const desiredCategory = this.data.activeCategory || this.initialCategory || CATEGORY_ALL
    const categoryOptions = buildCategoryList(sourceList)
    const nextCategory = categoryOptions.some((item) => item.value === desiredCategory)
      ? desiredCategory
      : CATEGORY_ALL
    const desiredCity = this.data.activeCity || this.initialCity || CITY_ALL
    const cityOptions = buildCityList(sourceList, nextCategory)
    const nextCity = cityOptions.some((item) => item.value === desiredCity)
      ? desiredCity
      : CITY_ALL
    const rawList = filterByCategoryAndCity(sourceList, nextCategory, nextCity)
    const selectedKeys = (this.data.selectedKeys || []).filter((key) => rawList.some((item) => item.key === key))
    const list = attachSelectedState(rawList, selectedKeys)

    this.initialCategory = nextCategory
    this.initialCity = nextCity

    this.setData({
      activeCategory: nextCategory,
      activeCity: nextCity,
      categoryOptions,
      cityOptions,
      activeCategoryLabel: getOptionLabel(categoryOptions, nextCategory, '全部分类'),
      activeCityLabel: getOptionLabel(cityOptions, nextCity, '全部城市'),
      list,
      selectedKeys,
      allSelected: !!list.length && selectedKeys.length === list.length,
      showCategoryPanel: false,
      showCityPanel: false,
    })
  },

  closePanels() {
    this.setData({
      showCategoryPanel: false,
      showCityPanel: false,
    })
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

  selectCategory(e) {
    const value = e.currentTarget.dataset.value || CATEGORY_ALL
    this.setData({
      activeCategory: value,
      activeCity: CITY_ALL,
      selectedKeys: [],
    }, () => this.refreshPage())
  },

  selectCity(e) {
    const value = e.currentTarget.dataset.value || CITY_ALL
    this.setData({
      activeCity: value,
      selectedKeys: [],
    }, () => this.refreshPage())
  },

  toggleSelect(e) {
    const key = e.currentTarget.dataset.key
    if (!key) {
      return
    }

    const exists = this.data.selectedKeys.includes(key)
    const selectedKeys = exists
      ? this.data.selectedKeys.filter((item) => item !== key)
      : this.data.selectedKeys.concat(key)

    this.setData({
      selectedKeys,
      list: attachSelectedState(this.data.list, selectedKeys),
      allSelected: !!this.data.list.length && selectedKeys.length === this.data.list.length,
    })
  },

  toggleSelectAll() {
    const allSelected = !this.data.allSelected
    this.setData({
      allSelected,
      selectedKeys: allSelected ? this.data.list.map((item) => item.key) : [],
      list: attachSelectedState(this.data.list, allSelected ? this.data.list.map((item) => item.key) : []),
    })
  },

  handleDelete() {
    if (!this.data.selectedKeys.length) {
      return
    }

    wx.showModal({
      title: '删除收藏',
      content: `确认删除已选中的 ${this.data.selectedKeys.length} 项收藏吗？`,
      success: (res) => {
        if (!res.confirm) {
          return
        }

        deleteFavorites(this.data.selectedKeys)
        this.setData({
          selectedKeys: [],
          allSelected: false,
        }, () => this.refreshPage())
        wx.showToast({
          title: '已删除',
          icon: 'success',
        })
      },
    })
  },

  closePage() {
    wx.navigateBack()
  },

  noop() {},
})
