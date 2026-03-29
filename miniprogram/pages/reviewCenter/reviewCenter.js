const app = getApp()

const REVIEW_TABS = [
  { key: 'pending', label: '待评价' },
  { key: 'append', label: '可追评' },
  { key: 'reviewed', label: '已评价' },
]

const QA_TABS = [
  { key: 'pending_answer', label: '待回答' },
  { key: 'asked', label: '已提问' },
  { key: 'followed', label: '已关注' },
  { key: 'answered', label: '已回答' },
]

const EMPTY_TEXT = {
  pending: '暂无待评价的订单',
  append: '暂无可追评的订单',
  reviewed: '暂无已评价的订单',
}

const QA_EMPTY_TEXT = {
  pending_answer: '暂无待回答的问题',
  asked: '暂无已提问内容',
  followed: '暂无已关注的问题',
  answered: '暂无已回答的问题',
}

Page({
  data: {
    topTab: 'review',
    reviewTab: 'pending',
    qaTab: 'pending_answer',
    reviewTabs: REVIEW_TABS,
    qaTabs: QA_TABS,
    emptyText: EMPTY_TEXT.pending,
    qaEmptyText: QA_EMPTY_TEXT.pending_answer,
    userAvatar: '/images/avatar.png',
  },

  onLoad(options) {
    const userInfo = app.getUserInfo ? (app.getUserInfo() || {}) : {}
    const reviewTab = options.tab || 'pending'
    this.setData({
      reviewTab: REVIEW_TABS.some((item) => item.key === reviewTab) ? reviewTab : 'pending',
      emptyText: EMPTY_TEXT[reviewTab] || EMPTY_TEXT.pending,
      userAvatar: userInfo.avatarUrl || '/images/avatar.png',
    })
  },

  switchTopTab(e) {
    this.setData({
      topTab: e.currentTarget.dataset.tab,
    })
  },

  switchReviewTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({
      reviewTab: tab,
      emptyText: EMPTY_TEXT[tab] || EMPTY_TEXT.pending,
    })
  },

  switchQaTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({
      qaTab: tab,
      qaEmptyText: QA_EMPTY_TEXT[tab] || QA_EMPTY_TEXT.pending_answer,
    })
  },

  onAvatarError() {
    this.setData({
      userAvatar: '/images/avatar.png',
    })
  },

  goRule() {
    wx.navigateTo({
      url: '/pages/qaCenter/qaCenter',
    })
  },
})
