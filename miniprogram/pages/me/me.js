const app = getApp()

const DEFAULT_LOGGED_IN_AVATAR = '/images/avatar.png'
const GUEST_AVATAR = '/images/me/guest-avatar.png'

const TEXT = {
  defaultNickname: 'e\u4f4d\u65c5\u5ba2',
  guestHint: '\u767b\u5f55\u5f00\u542f\u6211\u7684\u4e13\u5c5e\u519c\u65c5\u4f53\u9a8c',
  authLogin: '\u6388\u6743\u767b\u5f55',
  editProfile: '\u4fee\u6539\u4e2a\u4eba\u8d44\u6599',
  myDNA: '\u519c\u65c5DNA',
  dnaPlaceholder: '\u70b9\u51fb\u67e5\u770b\u548c\u8c03\u6574\u4f60\u7684\u4e13\u5c5e\u6807\u7b7e',
  dnaPlaceholderGuest: '\u767b\u5f55\u5b9a\u5236\u6211\u7684\u4e13\u5c5e\u6807\u7b7e',
  myOrders: '\u6211\u7684\u8ba2\u5355',
  allOrders: '\u5168\u90e8',
  favorites: '\u6536\u85cf\u6d4f\u89c8',
  history: '\u6d4f\u89c8\u5386\u53f2',
  customerService: '\u5728\u7ebf\u5ba2\u670d',
  systemSettings: '\u7cfb\u7edf\u8bbe\u7f6e',
  clearLoginState: '\u6e05\u9664\u672c\u5730\u767b\u5f55\u6001',
  clearLocalTestData: '\u6e05\u9664\u672c\u5730\u6d4b\u8bd5\u6570\u636e',
  systemSettingsCancel: '\u53d6\u6d88',
  logout: '\u9000\u51fa\u767b\u5f55',
  historyDeveloping: '\u6d4f\u89c8\u5386\u53f2\u5f00\u53d1\u4e2d',
  customerServiceDeveloping: '\u5728\u7ebf\u5ba2\u670d\u5f00\u53d1\u4e2d',
  systemSettingsDeveloping: '\u7cfb\u7edf\u8bbe\u7f6e\u5f00\u53d1\u4e2d',
  clearDone: '\u5df2\u6e05\u7406',
  logoutSuccess: '\u5df2\u9000\u51fa\u767b\u5f55',
}

const ORDER_ENTRIES = [
  {
    key: 'pending_payment',
    tab: 'pending_payment',
    label: '\u5f85\u652f\u4ed8',
    icon: '/images/me/order-status/pending-payment.png',
  },
  {
    key: 'pending_trip',
    tab: 'pending_trip',
    label: '\u5f85\u51fa\u884c',
    icon: '/images/me/order-status/pending-trip.png',
  },
  {
    key: 'pending_receive',
    tab: 'pending_receive',
    label: '\u5f85\u6536\u8d27',
    icon: '/images/me/order-status/pending-receive.png',
  },
  {
    key: 'review',
    tab: 'pending',
    label: '\u8bc4\u4ef7',
    icon: '/images/me/order-status/review.png',
  },
  {
    key: 'refund_after_sale',
    tab: 'refund_after_sale',
    label: '\u9000\u6b3e/\u552e\u540e',
    icon: '/images/me/order-status/refund-after-sale.png',
  },
]

Page({
  data: {
    text: TEXT,
    orderEntries: ORDER_ENTRIES,
    statusBarHeight: 20,
    loggedIn: false,
    userInfo: {
      avatarUrl: GUEST_AVATAR,
      nickName: '',
    },
    dnaTags: [],
    dnaPlaceholderText: TEXT.dnaPlaceholderGuest,
  },

  onLoad() {
    this.initNavMetrics()
  },

  onShow() {
    this.refreshUser()
  },

  initNavMetrics() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20,
      })
    } catch (err) {
      this.setData({
        statusBarHeight: 20,
      })
    }
  },

  refreshUser() {
    const rawUserInfo = app.getUserInfo() || {}
    const loggedIn = !!rawUserInfo.openid
    const avatarUrl = loggedIn
      ? (rawUserInfo.avatarUrl || DEFAULT_LOGGED_IN_AVATAR)
      : GUEST_AVATAR
    const nickName = loggedIn
      ? (rawUserInfo.nickName || TEXT.defaultNickname)
      : ''
    const dnaTags = loggedIn && Array.isArray(rawUserInfo.dnaTags)
      ? rawUserInfo.dnaTags
      : []

    this.setData({
      loggedIn,
      userInfo: {
        avatarUrl,
        nickName,
      },
      dnaTags,
      dnaPlaceholderText: loggedIn ? TEXT.dnaPlaceholder : TEXT.dnaPlaceholderGuest,
    })
  },

  onAvatarError() {
    this.setData({
      'userInfo.avatarUrl': DEFAULT_LOGGED_IN_AVATAR,
    })
  },

  onUserBoxTap() {
    if (!this.data.loggedIn) {
      this.goLogin()
    }
  },

  goLogin() {
    wx.navigateTo({
      url: '/pages/login/login',
    })
  },

  goEditProfile() {
    wx.navigateTo({
      url: '/pages/registerProfile/registerProfile?mode=edit',
    })
  },

  goMyDNATags() {
    if (!this.data.loggedIn) {
      this.goLogin()
      return
    }

    wx.navigateTo({
      url: '/pages/dnaTag/dnaTag?mode=edit',
    })
  },

  goAllOrders() {
    wx.navigateTo({
      url: '/pages/myOrders/myOrders?tab=all',
    })
  },

  goOrderTab(e) {
    const { tab } = e.currentTarget.dataset
    if (tab === 'pending') {
      wx.navigateTo({
        url: '/pages/reviewCenter/reviewCenter?tab=pending',
      })
      return
    }

    wx.navigateTo({
      url: `/pages/myOrders/myOrders?tab=${tab || 'all'}`,
    })
  },

  goFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/favorites',
    })
  },

  goHistory() {
    wx.showToast({
      title: TEXT.historyDeveloping,
      icon: 'none',
    })
  },

  goCustomerService() {
    wx.showToast({
      title: TEXT.customerServiceDeveloping,
      icon: 'none',
    })
  },

  goSystemSetting() {
    wx.showActionSheet({
      itemList: [TEXT.clearLoginState, TEXT.clearLocalTestData],
      success: (res) => {
        if (res.tapIndex === 0) {
          app.clearUserInfo()
          wx.showToast({
            title: TEXT.clearDone,
            icon: 'success',
          })
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/home/home',
            })
          }, 250)
          return
        }

        if (res.tapIndex === 1) {
          app.clearLocalTestData()
          wx.showToast({
            title: TEXT.clearDone,
            icon: 'success',
          })
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/home/home',
            })
          }, 250)
        }
      },
      fail: () => {},
    })
  },

  logout() {
    app.clearUserInfo()
    this.setData({
      loggedIn: false,
      userInfo: {
        avatarUrl: GUEST_AVATAR,
        nickName: '',
      },
      dnaTags: [],
    })

    wx.showToast({
      title: TEXT.logoutSuccess,
      icon: 'success',
    })

    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/home/home',
      })
    }, 300)
  },
})
