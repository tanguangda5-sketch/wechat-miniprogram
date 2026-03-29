const { resolveActivityCover } = require('../../utils/mediaAssets')
const { buildActivityCoverTags } = require('../../utils/activityCoverTags')

const FUN_TAG_GROUPS = [
  {
    id: 'family',
    title: '亲子采摘',
    keywords: ['亲子', '采摘', '果园', '草莓'],
  },
  {
    id: 'craft',
    title: '非遗手作',
    keywords: ['非遗', '手作', '体验'],
  },
  {
    id: 'weekend',
    title: '周末微度假',
    keywords: ['乡村', '文旅', '民宿', '摄影', '康养'],
  },
  {
    id: 'study',
    title: '田园研学',
    keywords: ['研学', '劳动', '课堂', '实践'],
  },
]

function normalizeText(value = '') {
  return String(value || '').trim()
}

Page({
  data: {
    tagGroups: FUN_TAG_GROUPS,
    activeTagIndex: 0,
    activityList: [],
    showList: [],
  },

  onLoad() {
    this.loadActivities()
  },

  async loadActivities() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getactivities',
      })

      const list = (res.result && res.result.list) || []
      const mapped = await Promise.all(
        list.map(async (item) => ({
          id: item._id,
          sourceType: item.sourceType || 'demo',
          title: item.title || '未命名活动',
          cover: await resolveActivityCover(item),
          tags: buildActivityCoverTags(item).combinedTags,
          rawTags: item.tags || [],
        }))
      )

      this.setData(
        {
          activityList: mapped,
        },
        () => this.applyFilter()
      )
    } catch (err) {
      console.error('[ruralFun] load activities failed', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none',
      })
    }
  },

  applyFilter() {
    const { activityList, tagGroups, activeTagIndex } = this.data
    const currentGroup = tagGroups[activeTagIndex] || tagGroups[0]
    const keywords = (currentGroup && currentGroup.keywords) || []

    const showList = activityList.filter((activity) => {
      const textList = [normalizeText(activity.title), ...(activity.rawTags || []).map(normalizeText)]
      return textList.some((text) => keywords.some((keyword) => text.includes(keyword)))
    })

    this.setData({
      showList: showList.length ? showList : activityList,
    })
  },

  changeTag(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData(
      {
        activeTagIndex: idx,
      },
      () => this.applyFilter()
    )
  },

  goActivityDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }

    wx.navigateTo({
      url: `/pages/activityDetail/activityDetail?id=${id}`,
    })
  },
})
