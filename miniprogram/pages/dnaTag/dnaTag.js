const app = getApp()

const TEXT = {
  setupTitle: '\u5b9a\u5236\u6211\u7684\u519c\u65c5 DNA',
  desc: '\u9009\u62e9\u65c5\u884c\u65b9\u5f0f\u548c\u65c5\u884c\u73a9\u6cd5\uff0c\u5e2e\u52a9\u6211\u4eec\u63a8\u8350\u66f4\u9002\u5408\u4f60\u7684\u6d3b\u52a8\u4e0e\u5546\u54c1\u3002',
  skip: '\u8df3\u8fc7',
  travelModesTitle: '\u65c5\u884c\u65b9\u5f0f',
  travelStylesTitle: '\u65c5\u884c\u73a9\u6cd5',
  saveAndEnterHome: '\u4fdd\u5b58\u5e76\u8fdb\u5165\u9996\u9875',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25',
  saved: 'DNA \u5df2\u4fdd\u5b58',
  skipped: '\u5df2\u8df3\u8fc7 DNA \u8bbe\u7f6e',
  travelModes: [
    '\u81ea\u7531\u884c',
    '\u8ddf\u56e2\u6e38',
    '\u4eb2\u5b50\u51fa\u884c',
    '\u9000\u4f11\u65c5\u5c45',
    '\u79c1\u4eba\u5b9a\u5236',
    '\u627e\u642d\u5b50',
    '\u56e2\u961f\u51fa\u6e38',
    '\u72ec\u81ea\u65c5\u884c',
  ],
  travelStyles: [
    '\u79cd\u690d\u91c7\u6458',
    '\u6816\u5c45\u5c71\u91ce',
    '\u519c\u4e8b\u79d1\u666e',
    '\u7f8e\u98df\u7f8e\u9152',
    '\u624b\u5de5\u5de5\u574a',
    '\u975e\u9057\u6587\u5316',
    '\u751f\u6001\u89c2\u5149',
    '\u521b\u610f\u6444\u5f71',
  ],
}

function buildTagMap(tags) {
  return tags.reduce((acc, tag) => {
    acc[tag] = true
    return acc
  }, {})
}

function ensureBoundSession() {
  const app = getApp()
  if (app.hasActiveSession && app.hasActiveSession({ requireBoundPhone: true })) {
    return true
  }

  wx.showToast({
    title: '请先完成登录后再保存标签',
    icon: 'none',
  })

  setTimeout(() => {
    wx.redirectTo({
      url: '/pages/login/login',
    })
  }, 250)

  return false
}

Page({
  data: {
    text: {
      setupTitle: TEXT.setupTitle,
      desc: TEXT.desc,
      skip: TEXT.skip,
      travelModesTitle: TEXT.travelModesTitle,
      travelStylesTitle: TEXT.travelStylesTitle,
      saveAndEnterHome: TEXT.saveAndEnterHome,
    },
    mode: 'setup',
    travelModes: TEXT.travelModes,
    travelStyles: TEXT.travelStyles,
    selectedModes: [],
    selectedStyles: [],
    selectedModeMap: {},
    selectedStyleMap: {},
    loading: false,
  },

  onLoad(options) {
    const mode = options.mode || 'setup'
    const userInfo = app.getUserInfo() || {}
    const dnaTags = userInfo.dnaTags || []
    const selectedModes = dnaTags.filter((tag) => TEXT.travelModes.includes(tag))
    const selectedStyles = dnaTags.filter((tag) => TEXT.travelStyles.includes(tag))

    this.setData({
      mode,
      selectedModes,
      selectedStyles,
      selectedModeMap: buildTagMap(selectedModes),
      selectedStyleMap: buildTagMap(selectedStyles),
    })
  },

  toggleModeTag(e) {
    this.toggleTag('selectedModes', 'selectedModeMap', e.currentTarget.dataset.tag)
  },

  toggleStyleTag(e) {
    this.toggleTag('selectedStyles', 'selectedStyleMap', e.currentTarget.dataset.tag)
  },

  toggleTag(field, mapField, tag) {
    const current = this.data[field]
    const exists = current.includes(tag)
    const next = exists ? current.filter((item) => item !== tag) : [...current, tag]

    this.setData({
      [field]: next,
      [mapField]: buildTagMap(next),
    })
  },

  async onSkip() {
    await this.submitTags([])
  },

  async onSave() {
    const tags = [...this.data.selectedModes, ...this.data.selectedStyles]
    await this.submitTags(tags)
  },

  async submitTags(tags) {
    if (!ensureBoundSession()) {
      return
    }

    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'userManage',
        data: {
          action: 'updateDNATags',
          tags,
        },
      })

      if (!res.result.success) {
        wx.showToast({ title: TEXT.saveFailed, icon: 'none' })
        return
      }

      app.setUserInfo(res.result.userInfo)
      wx.showToast({
        title: tags.length ? TEXT.saved : TEXT.skipped,
        icon: 'success',
      })

      if (this.data.mode === 'edit') {
        wx.navigateBack()
        return
      }

      wx.switchTab({ url: '/pages/home/home' })
    } catch (err) {
      console.error('[dna] submit dna tags failed', err)
      wx.showToast({ title: TEXT.saveFailed, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
