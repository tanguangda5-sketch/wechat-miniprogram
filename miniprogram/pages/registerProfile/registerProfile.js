const app = getApp()

const DEFAULT_AVATAR = '/images/avatar.png'
const MAX_AVATAR_SOURCE_SIZE = 2 * 1024 * 1024
const TEXT = {
  unknown: '\u672a\u77e5',
  male: '\u7537',
  female: '\u5973',
  takePhoto: '\u62cd\u7167',
  chooseFromAlbum: '\u4ece\u76f8\u518c\u9009\u62e9',
  uploading: '\u4e0a\u4f20\u4e2d...',
  uploadSuccess: '\u4e0a\u4f20\u6210\u529f',
  uploadFailed: '\u4e0a\u4f20\u5931\u8d25',
  avatarTooLarge: '\u9009\u62e9\u7684\u56fe\u7247\u8d85\u8fc7 2MB\uff0c\u8bf7\u5148\u538b\u7f29\u540e\u518d\u4e0a\u4f20',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25',
  skippedProfile: '\u5df2\u8df3\u8fc7\u8d44\u6599\u586b\u5199',
  profileSaved: '\u8d44\u6599\u5df2\u4fdd\u5b58',
  title: '\u5b8c\u5584\u4e2a\u4eba\u8d44\u6599',
  skip: '\u8df3\u8fc7',
  avatar: '\u5934\u50cf',
  avatarHint: '\u62cd\u7167\u6216\u4ece\u76f8\u518c\u9009\u62e9',
  nickname: '\u6635\u79f0',
  nicknamePlaceholder: '\u672a\u586b\u5199\u65f6\u5c06\u663e\u793a\u4e3a e\u4f4d\u65c5\u5ba2',
  gender: '\u6027\u522b',
  birth: '\u751f\u65e5',
  enableBirth: '\u662f\u5426\u586b\u5199\u751f\u65e5',
  birthUnknown: '\u672a\u586b\u5199\u65f6\u5c06\u663e\u793a\u4e3a\u672a\u77e5',
  saveAndContinue: '\u4fdd\u5b58\u5e76\u7ee7\u7eed',
}

const GENDERS = [TEXT.unknown, TEXT.male, TEXT.female]

function ensureBoundSession() {
  const app = getApp()
  if (app.hasActiveSession && app.hasActiveSession({ requireBoundPhone: true })) {
    return true
  }

  wx.showToast({
    title: '请先完成登录后再保存资料',
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
      title: TEXT.title,
      skip: TEXT.skip,
      avatar: TEXT.avatar,
      avatarHint: TEXT.avatarHint,
      nickname: TEXT.nickname,
      nicknamePlaceholder: TEXT.nicknamePlaceholder,
      gender: TEXT.gender,
      birth: TEXT.birth,
      enableBirth: TEXT.enableBirth,
      birthUnknown: TEXT.birthUnknown,
      saveAndContinue: TEXT.saveAndContinue,
    },
    mode: 'register',
    avatar: DEFAULT_AVATAR,
    nickname: '',
    gender: TEXT.unknown,
    genders: GENDERS,
    birthEnabled: false,
    birth: {
      year: new Date().getFullYear() - 25,
      month: 1,
      day: 1,
    },
    years: [],
    months: [],
    days: [],
    selectedYearIndex: 0,
    selectedMonthIndex: 0,
    selectedDayIndex: 0,
    loading: false,
  },

  onLoad(options) {
    this.initializeDatePickers()

    const mode = options.mode || 'register'
    const userInfo = app.getUserInfo() || {}
    const birthDate = userInfo.birthDate ? new Date(userInfo.birthDate) : null
    const hasValidBirthDate = birthDate && !Number.isNaN(birthDate.getTime())

    const initBirth = hasValidBirthDate
      ? {
          year: birthDate.getFullYear(),
          month: birthDate.getMonth() + 1,
          day: birthDate.getDate(),
        }
      : this.data.birth

    this.setData({
      mode,
      avatar: userInfo.avatarUrl || DEFAULT_AVATAR,
      nickname: userInfo.nickName || '',
      gender: userInfo.gender || TEXT.unknown,
      birthEnabled: !!hasValidBirthDate,
      birth: initBirth,
    })

    this.syncBirthPickerIndices(initBirth)
  },

  initializeDatePickers() {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear - 80; year <= currentYear; year += 1) {
      years.push(year)
    }

    this.setData({
      years,
      months: Array.from({ length: 12 }, (_, i) => i + 1),
      days: Array.from({ length: 31 }, (_, i) => i + 1),
    })
  },

  syncBirthPickerIndices(birth) {
    this.setData({
      selectedYearIndex: this.data.years.findIndex((item) => item === birth.year),
      selectedMonthIndex: birth.month - 1,
      selectedDayIndex: birth.day - 1,
    })
  },

  onSelectAvatar() {
    wx.showActionSheet({
      itemList: [TEXT.takePhoto, TEXT.chooseFromAlbum],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.chooseAvatar(['camera'])
          return
        }
        this.chooseAvatar(['album'])
      },
    })
  },

  chooseAvatar(sourceType) {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType,
      success: async (res) => {
        const imagePath = (res.tempFilePaths && res.tempFilePaths[0]) || ''
        const selectedFile = Array.isArray(res.tempFiles) ? res.tempFiles[0] : null

        if (selectedFile && selectedFile.size > MAX_AVATAR_SOURCE_SIZE) {
          wx.showToast({
            title: TEXT.avatarTooLarge,
            icon: 'none',
          })
          return
        }

        if (!imagePath) {
          wx.showToast({
            title: TEXT.uploadFailed,
            icon: 'none',
          })
          return
        }

        await this.uploadAvatar(imagePath)
      },
      fail: (err) => {
        console.error('[profile] choose avatar failed', err)
      },
    })
  },

  async uploadAvatar(imagePath) {
    try {
      wx.showLoading({ title: TEXT.uploading })
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `avatars/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
        filePath: imagePath,
      })

      this.setData({ avatar: uploadRes.fileID })
      wx.showToast({ title: TEXT.uploadSuccess, icon: 'success' })
    } catch (err) {
      console.error('[profile] upload avatar failed', err)
      wx.showToast({ title: TEXT.uploadFailed, icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  onAvatarError() {
    this.setData({
      avatar: DEFAULT_AVATAR,
    })
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  pickerGender(e) {
    const gender = this.data.genders[e.detail.value]
    this.setData({ gender })
  },

  toggleBirthEnabled(e) {
    this.setData({ birthEnabled: !!e.detail.value })
  },

  pickerYear(e) {
    const year = this.data.years[e.detail.value]
    this.setData({
      selectedYearIndex: e.detail.value,
      'birth.year': year,
    })
  },

  pickerMonth(e) {
    this.setData({
      selectedMonthIndex: e.detail.value,
      'birth.month': Number(e.detail.value) + 1,
    })
  },

  pickerDay(e) {
    this.setData({
      selectedDayIndex: e.detail.value,
      'birth.day': Number(e.detail.value) + 1,
    })
  },

  async onSkip() {
    await this.submitProfile(true)
  },

  async onSave() {
    await this.submitProfile(false)
  },

  async submitProfile(isSkip) {
    if (!ensureBoundSession()) {
      return
    }

    this.setData({ loading: true })
    try {
      const profile = {
        avatarUrl: this.data.avatar === DEFAULT_AVATAR ? '' : this.data.avatar,
        nickName: this.data.nickname.trim(),
        gender: this.data.gender || TEXT.unknown,
        birthDate: this.data.birthEnabled
          ? `${this.data.birth.year}-${String(this.data.birth.month).padStart(2, '0')}-${String(this.data.birth.day).padStart(2, '0')}`
          : '',
        profileCompleted: true,
      }

      const result = await wx.cloud.callFunction({
        name: 'userManage',
        data: {
          action: 'updateProfile',
          profile,
        },
      })

      if (!result.result.success) {
        wx.showToast({ title: TEXT.saveFailed, icon: 'none' })
        return
      }

      app.setUserInfo(result.result.userInfo)
      wx.showToast({
        title: isSkip ? TEXT.skippedProfile : TEXT.profileSaved,
        icon: 'success',
      })

      wx.redirectTo({ url: '/pages/dnaTag/dnaTag?mode=setup' })
    } catch (err) {
      console.error('[profile] submit profile failed', err)
      wx.showToast({ title: TEXT.saveFailed, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
