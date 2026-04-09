const { resolveKnowledgeArticleMedia } = require('../../utils/knowledgeArticle')

const DEFAULT_TAB = 'agri'
const DEFAULT_CATEGORY = '全部'
const TAB_COPY = {
  agri: {
    heroChip: '农事资讯',
    heroTitle: '农旅宝典',
    heroSubtitle: '聚焦农业、乡村与实用内容',
    heroDesc: '内容来自云数据库，支持控制台持续维护',
    feedTitle: '今日农事',
    feedSubtitle: '农业、乡村、实用经验',
    emptyTitle: '当前分类还没有农事内容',
    emptyText: '你可以先在云开发控制台新增农事文章，再回来查看展示效果',
  },
  culture: {
    heroChip: '文旅资讯',
    heroTitle: '农旅宝典',
    heroSubtitle: '聚焦景点文化、民俗非遗与游玩知识',
    heroDesc: '图片走云存储，文章内容可在云开发控制台直接更新',
    feedTitle: '今日文旅',
    feedSubtitle: '文化、体验、游玩知识',
    emptyTitle: '当前分类还没有文旅内容',
    emptyText: '你可以先在云开发控制台新增文旅文章，再回来查看展示效果',
  },
  red: {
    heroChip: '红色文旅',
    heroTitle: '农旅宝典',
    heroSubtitle: '聚焦革命旧址、纪念场馆与红色地标故事',
    heroDesc: '首批内容围绕甘肃红色文旅展开，沿用现有文章详情模板展示',
    feedTitle: '今日红色文旅',
    feedSubtitle: '旧址、纪念馆、线路与精神地标',
    emptyTitle: '当前分类还没有红色文旅内容',
    emptyText: '你可以先在云开发控制台新增红色文旅文章，再回来查看展示效果',
  },
}

function getTabCopy(tab = '') {
  return TAB_COPY[tab] || TAB_COPY[DEFAULT_TAB]
}

Page({
  data: {
    loading: true,
    activeTab: DEFAULT_TAB,
    currentCategory: DEFAULT_CATEGORY,
    categories: [],
    filteredList: [],
    heroCover: '',
    heroChip: TAB_COPY[DEFAULT_TAB].heroChip,
    heroTitle: TAB_COPY[DEFAULT_TAB].heroTitle,
    heroSubtitle: TAB_COPY[DEFAULT_TAB].heroSubtitle,
    heroDesc: TAB_COPY[DEFAULT_TAB].heroDesc,
    feedTitle: TAB_COPY[DEFAULT_TAB].feedTitle,
    feedSubtitle: TAB_COPY[DEFAULT_TAB].feedSubtitle,
    emptyTitle: TAB_COPY[DEFAULT_TAB].emptyTitle,
    emptyText: TAB_COPY[DEFAULT_TAB].emptyText,
  },

  onLoad() {
    this.fullList = []
    this.loadArticles()
  },

  onPullDownRefresh() {
    this.loadArticles().finally(() => wx.stopPullDownRefresh())
  },

  syncTabCopy(tab = this.data.activeTab) {
    this.setData(getTabCopy(tab))
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
      this.syncTabCopy(this.data.activeTab)
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
      this.syncTabCopy(this.data.activeTab)
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
    })
    this.syncTabCopy(activeTab)

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
