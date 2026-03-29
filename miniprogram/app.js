const USER_INFO_KEY = 'userInfo'
const LOGOUT_FLAG_KEY = 'manualLoggedOut'
const RESET_KEYS = [
  USER_INFO_KEY,
  LOGOUT_FLAG_KEY,
  'selectedRegion',
  'userLocation',
  'recentRegionList',
]

App({
  globalData: {
    userInfo: null,
    templateId: {},
  },

  onLaunch(options) {
    wx.cloud.init({
      env: 'cloud1-3ghmr5ki7b1172fe',
      traceUser: true,
    })

    this.bootstrap(options)
  },

  async bootstrap(options = {}) {
    try {
      const targetUrl = this.getLaunchTarget()

      if (targetUrl) {
        setTimeout(() => {
          wx.reLaunch({ url: targetUrl })
        }, 80)
      }
    } catch (err) {
      console.error('bootstrap failed', err)
    }
  },

  getLaunchTarget() {
    const agreePrivacy = wx.getStorageSync('agreePrivacy')
    if (!agreePrivacy) {
      return '/pages/welcome/welcome'
    }

    if (wx.getStorageSync(LOGOUT_FLAG_KEY)) {
      this.globalData.userInfo = null
      return '/pages/home/home'
    }

    const userInfo = this.getUserInfo()
    if (!userInfo) {
      return '/pages/home/home'
    }

    this.globalData.userInfo = userInfo
    return this.getPostLoginTarget(userInfo)
  },

  getPostLoginTarget(userInfo) {
    if (!userInfo.hasBoundPhone) {
      return '/pages/login/login'
    }

    if (userInfo.onboardingCompleted) {
      return '/pages/home/home'
    }

    if (!userInfo.locationChoiceMade) {
      return '/pages/permissionSettings/permissionSettings?mode=onboarding'
    }

    if (!userInfo.profileCompleted) {
      return '/pages/registerProfile/registerProfile?mode=register'
    }

    if (!userInfo.dnaCompleted) {
      return '/pages/dnaTag/dnaTag?mode=setup'
    }

    return '/pages/home/home'
  },

  setUserInfo(userInfo) {
    if (!userInfo || !userInfo.openid) {
      this.clearUserInfo({ markLoggedOut: false })
      return
    }

    this.globalData.userInfo = userInfo
    wx.setStorageSync(USER_INFO_KEY, userInfo)
    wx.removeStorageSync(LOGOUT_FLAG_KEY)
  },

  clearUserInfo(options = {}) {
    const { markLoggedOut = true } = options
    this.globalData.userInfo = null
    wx.removeStorageSync(USER_INFO_KEY)
    if (markLoggedOut) {
      wx.setStorageSync(LOGOUT_FLAG_KEY, true)
    } else {
      wx.removeStorageSync(LOGOUT_FLAG_KEY)
    }
  },

  getUserInfo() {
    if (wx.getStorageSync(LOGOUT_FLAG_KEY)) {
      return null
    }

    const userInfo = this.globalData.userInfo || wx.getStorageSync(USER_INFO_KEY)
    if (!userInfo || !userInfo.openid) {
      return null
    }

    return userInfo
  },

  hasActiveSession(options = {}) {
    const { requireBoundPhone = false } = options
    const userInfo = this.getUserInfo()
    if (!userInfo) {
      return false
    }

    if (requireBoundPhone && !userInfo.hasBoundPhone) {
      return false
    }

    return true
  },

  clearLocalTestData() {
    this.globalData.userInfo = null
    RESET_KEYS.forEach((key) => {
      wx.removeStorageSync(key)
    })
  },
})
