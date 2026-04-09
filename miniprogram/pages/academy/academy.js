const { resolveKnowledgeArticleMedia } = require('../../utils/knowledgeArticle')

const DEFAULT_TAB = 'agri'
const DEFAULT_CATEGORY = '全部'
const TAB_CONFIG = {
  agri: {
    label: '农事宝典',
    heroChip: '农事资讯',
    heroSubtitle: '聚焦农业、乡村与实用内容',
    heroDesc: '内容来自云数据库，支持控制台持续维护',
    feedTitle: '今日农事',
    feedSubtitle: '农业、乡村、实用经验',
  },
  culture: {
    label: '文旅课堂',
    heroChip: '文旅资讯',
    heroSubtitle: '聚焦景点文化、民俗非遗与游玩知识',
    heroDesc: '图片走云存储，文章内容可在云开发控制台直接更新',
    feedTitle: '今日文旅',
    feedSubtitle: '文化、体验、游玩知识',
  },
  redtour: {
    label: '红旅印记',
    heroChip: '红旅文章',
    heroSubtitle: '聚焦红色历史、革命旧址与研学阅读',
    heroDesc: '复用现有文章卡片与详情页模板，便于持续扩充红旅内容',
    feedTitle: '今日红旅',
    feedSubtitle: '红色历史、旧址故事、研学阅读',
  },
}

function getTabMeta(tab = DEFAULT_TAB) {
  return TAB_CONFIG[tab] || TAB_CONFIG[DEFAULT_TAB]
}

Page({
  data: {
    loading: true,
    activeTab: DEFAULT_TAB,
    currentCategory: DEFAULT_CATEGORY,
    categories: [],
    filteredList: [],
    heroCover: '',
    tabs: Object.keys(TAB_CONFIG).map((key) => ({
      key,
      label: TAB_CONFIG[key].label,
    })),
    ...getTabMeta(DEFAULT_TAB),
  },

  onLoad() {
    this.fullList = []
    this.loadArticles()
  },

  onPullDownRefresh() {
    this.loadArticles().finally(() => wx.stopPullDownRefresh())
  },

  async loadArticles() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getknowledgearticles',
        data: {
          channel: this.data.activeTab,
        },
      })

      const result = (res || {}).result || {}
      if (!result.ok) {
        throw new Error(result.error || 'load articles failed')
      }

      const resolvedList = await Promise.all(
        (result.list || []).map((item) => resolveKnowledgeArticleMedia(item))
      )

      const categories = Array.isArray(result.categories) && result.categories.length
        ? result.categories
        : [DEFAULT_CATEGORY]

      this.fullList = resolvedList
      this.setData({
        loading: false,
        categories,
        heroCover: (resolvedList[0] && resolvedList[0].cover) || '',
      })
      this.applyCategory(this.data.currentCategory)
    } catch (err) {
      console.error('[academy] load articles failed', err)
      this.fullList = []
      this.setData({
        loading: false,
        categories: [DEFAULT_CATEGORY],
        currentCategory: DEFAULT_CATEGORY,
        filteredList: [],
        heroCover: '',
      })
      wx.showToast({
        title: '文章加载失败',
        icon: 'none',
      })
    }
  },

  applyCategory(category) {
    const currentCategory = category || DEFAULT_CATEGORY
    const sourceList = this.fullList || []
    const filteredList = currentCategory === DEFAULT_CATEGORY
      ? sourceList
      : sourceList.filter((item) => (item.tags || []).includes(currentCategory))

    this.setData({
      currentCategory,
      filteredList,
    })
  },

  async switchTab(e) {
    const activeTab = e.currentTarget.dataset.tab
    if (!activeTab || activeTab === this.data.activeTab) {
      return
    }

    this.fullList = []
    this.setData({
      activeTab,
      currentCategory: DEFAULT_CATEGORY,
      categories: [],
      filteredList: [],
      heroCover: '',
      ...getTabMeta(activeTab),
    })

    await this.loadArticles()
  },

  switchCategory(e) {
    const currentCategory = e.currentTarget.dataset.category || DEFAULT_CATEGORY
    this.applyCategory(currentCategory)
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }

    wx.navigateTo({
      url: `/pages/knowledgeDetail/knowledgeDetail?id=${id}`,
    })
  },
})
