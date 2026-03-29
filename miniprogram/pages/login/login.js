const app = getApp()

const TEXT = {
  loginFailed: '\u767b\u5f55\u5931\u8d25',
  loginRetry: '\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
  continueBindPhone: '\u8bf7\u7ee7\u7eed\u7ed1\u5b9a\u624b\u673a\u53f7',
  finishWechatLoginFirst: '\u8bf7\u5148\u5b8c\u6210\u5fae\u4fe1\u767b\u5f55',
  noPhoneAuth: '\u672a\u83b7\u53d6\u5230\u624b\u673a\u53f7\u6388\u6743',
  cancelPhoneAuth: '\u4f60\u5df2\u53d6\u6d88\u624b\u673a\u53f7\u6388\u6743',
  noPhoneAuthPermission: '\u5f53\u524d\u5c0f\u7a0b\u5e8f\u6682\u672a\u5f00\u901a\u5fae\u4fe1\u624b\u673a\u53f7\u6388\u6743\u80fd\u529b',
  bindFailed: '\u7ed1\u5b9a\u5931\u8d25',
  bindRetry: '\u7ed1\u5b9a\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
  noPhoneAuthCode: '\u672a\u83b7\u53d6\u5230\u624b\u673a\u53f7\u6388\u6743 code',
  phoneNotFound: '\u672a\u89e3\u6790\u5230\u624b\u673a\u53f7',
  unsupportedLoginMethod: '\u4e0d\u652f\u6301\u7684\u767b\u5f55\u65b9\u5f0f',
  wechatLoginRequired: '\u8bf7\u5148\u5b8c\u6210\u5fae\u4fe1\u767b\u5f55',
  phoneAlreadyBound: '\u8be5\u624b\u673a\u53f7\u5df2\u7ed1\u5b9a\u5176\u4ed6\u8d26\u53f7',
  phoneBindRequired: '\u8bf7\u5148\u7ed1\u5b9a\u624b\u673a\u53f7',
  brandName: '\u519c\u65c5e\u7ad9',
  tagline: '\u4e61\u91ce\u98ce\u7269\u4e0e\u4e2a\u6027\u5316\u65c5\u7a0b\uff0c\u4ece\u8fd9\u91cc\u5f00\u59cb',
  heroTitle: '\u6388\u6743\u767b\u5f55\u540e\uff0c\u5feb\u901f\u5f00\u542f\u4f60\u7684\u4e13\u5c5e\u519c\u65c5\u4f53\u9a8c',
  titleWechat: '\u6b22\u8fce\u6765\u5230\u519c\u65c5e\u7ad9',
  titleBindPhone: '\u6388\u6743\u767b\u5f55\uff0c\u5f00\u542f\u4e13\u5c5e\u63a8\u8350',
  descBeforeLogin: '\u4e00\u952e\u767b\u5f55\u540e\uff0c\u5373\u53ef\u7ee7\u7eed\u5b8c\u5584\u4f60\u7684\u519c\u65c5\u504f\u597d\u4e0e\u4e13\u5c5e\u884c\u7a0b\u3002',
  descAfterLogin: '\u6388\u6743\u7ed1\u5b9a\u624b\u673a\u53f7\uff0c\u7528\u4e8e\u767b\u5f55\u8bc6\u522b\u3001\u8ba2\u5355\u670d\u52a1\u4e0e\u4e2a\u6027\u5316\u63a8\u8350\u3002',
  btnWechatLogin: '\u5fae\u4fe1\u4e00\u952e\u767b\u5f55',
  btnWechatPhone: '\u6388\u6743\u5e76\u7ee7\u7eed',
  agreementSummary: '\u5df2\u9605\u8bfb\u5e76\u540c\u610f\u300a\u519c\u65c5e\u7ad9\u4e2a\u4eba\u4fe1\u606f\u4fdd\u62a4\u6307\u5f15\u300b\u3001\u300a\u519c\u65c5e\u7ad9\u7528\u6237\u670d\u52a1\u8bf4\u660e\u300b',
  footer: '\u767b\u5f55\u540e\u5c06\u7ee7\u7eed\u5b8c\u6210\u5b9a\u4f4d\u3001\u8d44\u6599\u548c\u519c\u65c5 DNA \u8bbe\u7f6e\u3002',
  noQuota: '\u624b\u673a\u53f7\u6388\u6743\u989d\u5ea6\u4e0d\u8db3',
}

function mapCloudMessage(message) {
  const messageMap = {
    MISSING_PHONE_AUTH_CODE: TEXT.noPhoneAuthCode,
    PHONE_NUMBER_NOT_FOUND: TEXT.phoneNotFound,
    UNSUPPORTED_LOGIN_METHOD: TEXT.unsupportedLoginMethod,
    WECHAT_LOGIN_REQUIRED: TEXT.wechatLoginRequired,
    PHONE_ALREADY_BOUND: TEXT.phoneAlreadyBound,
    PHONE_BIND_REQUIRED: TEXT.phoneBindRequired,
  }
  return messageMap[message] || message
}

Page({
  data: {
    text: {
      brandName: TEXT.brandName,
      tagline: TEXT.tagline,
      heroTitle: TEXT.heroTitle,
      titleWechat: TEXT.titleWechat,
      titleBindPhone: TEXT.titleBindPhone,
      descBeforeLogin: TEXT.descBeforeLogin,
      descAfterLogin: TEXT.descAfterLogin,
      btnWechatLogin: TEXT.btnWechatLogin,
      btnWechatPhone: TEXT.btnWechatPhone,
      agreementSummary: TEXT.agreementSummary,
      footer: TEXT.footer,
    },
    loading: false,
    currentUser: null,
    hasWechatUser: false,
  },

  onShow() {
    const agreePrivacy = wx.getStorageSync('agreePrivacy')
    if (!agreePrivacy) {
      wx.redirectTo({ url: '/pages/welcome/welcome' })
      return
    }
    this.syncFromStorage()
  },

  syncFromStorage() {
    const currentUser = app.getUserInfo() || null
    this.setData({
      currentUser,
      hasWechatUser: !!(currentUser && currentUser.openid),
    })

    if (currentUser && currentUser.hasBoundPhone) {
      this.finishLogin(currentUser)
    }
  },

  isReadyForBinding() {
    const { currentUser } = this.data
    return !!(currentUser && currentUser.openid)
  },

  async onWechatLogin() {
    this.setData({ loading: true })
    try {
      const loginRes = await wx.cloud.callFunction({
        name: 'login',
        data: { method: 'wechat' },
      })

      if (!loginRes.result.success) {
        wx.showToast({ title: mapCloudMessage(loginRes.result.message) || TEXT.loginFailed, icon: 'none' })
        return
      }

      app.setUserInfo(loginRes.result.userInfo)
      this.setData({
        currentUser: loginRes.result.userInfo,
        hasWechatUser: true,
      })

      if (loginRes.result.userInfo.hasBoundPhone) {
        this.finishLogin(loginRes.result.userInfo)
        return
      }

      wx.showToast({ title: TEXT.continueBindPhone, icon: 'none' })
    } catch (err) {
      console.error('[login] wechat login failed', err)
      wx.showToast({ title: TEXT.loginRetry, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onGetPhoneNumber(e) {
    if (!this.isReadyForBinding()) {
      wx.showToast({ title: TEXT.finishWechatLoginFirst, icon: 'none' })
      return
    }

    const detail = e.detail || {}
    const { code, errMsg, errno } = detail

    console.log('[login] getPhoneNumber detail', {
      code,
      errMsg,
      errno,
    })

    if (!code) {
      if (errno === 1400001) {
        wx.showToast({ title: TEXT.noQuota, icon: 'none' })
        return
      }

      let toastTitle = TEXT.noPhoneAuth
      if (errMsg && errMsg.includes('deny')) toastTitle = TEXT.cancelPhoneAuth
      else if (errMsg && errMsg.includes('no permission')) toastTitle = TEXT.noPhoneAuthPermission

      wx.showToast({ title: toastTitle, icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { method: 'bindPhoneByWechat', code },
      })

      if (!res.result.success) {
        wx.showToast({ title: mapCloudMessage(res.result.message) || TEXT.bindFailed, icon: 'none' })
        return
      }

      app.setUserInfo(res.result.userInfo)
      this.finishLogin(res.result.userInfo)
    } catch (err) {
      console.error('[login] bind phone by wechat failed', err)
      wx.showToast({ title: TEXT.bindRetry, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  finishLogin(userInfo) {
    app.setUserInfo(userInfo)
    const target = app.getPostLoginTarget(userInfo)
    if (target === '/pages/home/home') {
      wx.switchTab({ url: target })
      return
    }
    wx.redirectTo({ url: target })
  },
})
