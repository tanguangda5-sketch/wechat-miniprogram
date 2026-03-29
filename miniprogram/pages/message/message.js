const app = getApp()
const {
  buildHomeRows,
  buildStoryList,
  formatConversationTime,
} = require('../../utils/messageStore')

const DEFAULT_AVATAR = '/images/avatar.png'

Page({
  data: {
    statusBarHeight: 20,
    userAvatar: DEFAULT_AVATAR,
    storyList: [],
    homeRows: [],
  },

  onShow() {
    this.initNavMetrics()
    this.refreshPage()
  },

  initNavMetrics() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 })
    } catch (error) {
      this.setData({ statusBarHeight: 20 })
    }
  },

  refreshPage() {
    const userInfo = app.getUserInfo ? (app.getUserInfo() || {}) : {}
    const userAvatar = userInfo.avatarUrl || DEFAULT_AVATAR
    this.setData({
      userAvatar,
      storyList: [
        {
          id: 'self-note-entry',
          kind: 'self-note',
          title: '发布笔记',
          avatarUrl: userAvatar,
          unreadText: '',
        },
      ].concat(buildStoryList().map((item) => ({
        ...item,
        unreadText: item.unread > 99 ? '99+' : (item.unread > 0 ? String(item.unread) : ''),
      }))),
      homeRows: buildHomeRows().map((item) => ({
        ...item,
        timeText: formatConversationTime(item.updatedAt),
        unreadText: item.unread > 99 ? '99+' : (item.unread > 0 ? String(item.unread) : ''),
      })),
    })
  },

  onUserAvatarError() {
    this.setData({ userAvatar: DEFAULT_AVATAR })
  },

  openRow(e) {
    const { kind, entryType, id } = e.currentTarget.dataset
    if (kind === 'conversation') {
      wx.navigateTo({ url: `/pages/messageConversation/messageConversation?id=${id}` })
      return
    }
    if (entryType === 'interactive') {
      wx.navigateTo({ url: '/pages/messageInteraction/messageInteraction' })
      return
    }
    if (entryType === 'merchant') {
      wx.navigateTo({ url: '/pages/messageMerchant/messageMerchant' })
      return
    }
    if (entryType === 'platform') {
      wx.navigateTo({ url: '/pages/messagePlatform/messagePlatform' })
      return
    }
    if (entryType === 'buddy') {
      wx.navigateTo({ url: '/pages/messageBuddyApply/messageBuddyApply' })
    }
  },

  openStory(e) {
    const { kind, noteId } = e.currentTarget.dataset
    if (kind === 'self-note') {
      wx.navigateTo({ url: '/pages/notePublish/notePublish' })
      return
    }
    if (noteId) {
      wx.navigateTo({ url: `/pages/noteDetail/noteDetail?id=${noteId}` })
      return
    }
    this.openRow({ currentTarget: { dataset: e.currentTarget.dataset } })
  },

  onMenuTap() {
    wx.showToast({ title: '菜单功能稍后接入', icon: 'none' })
  },

  onSearchTap() {
    wx.showToast({ title: '搜索功能稍后接入', icon: 'none' })
  },

  onAddTap() {
    wx.showActionSheet({
      itemList: ['去问小禾', '查看搭子申请', '打开平台消息'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: '/pages/askXiaoheChat/askXiaoheChat' })
          return
        }
        if (res.tapIndex === 1) {
          wx.navigateTo({ url: '/pages/messageBuddyApply/messageBuddyApply' })
          return
        }
        wx.navigateTo({ url: '/pages/messagePlatform/messagePlatform' })
      },
    })
  },
})
