Page({
  data: {
    text: {
      brand: '\u519c\u65c5e\u7ad9',
      title: '\u4e2a\u4eba\u4fe1\u606f\u4fdd\u62a4\u6307\u5f15',
      intro1: '\u4e3a\u4e86\u4e3a\u4f60\u63d0\u4f9b\u767b\u5f55\u8eab\u4efd\u8bc6\u522b\u3001\u624b\u673a\u53f7\u7ed1\u5b9a\u3001\u9644\u8fd1\u519c\u6587\u65c5\u63a8\u8350\u7b49\u670d\u52a1\uff0c\u6211\u4eec\u9700\u8981\u5728\u4f60\u4f7f\u7528\u672c\u5c0f\u7a0b\u5e8f\u524d\u5411\u4f60\u8bf4\u660e\u76f8\u5173\u4e2a\u4eba\u4fe1\u606f\u5904\u7406\u89c4\u5219\u3002',
      intro2: '\u6211\u4eec\u4f1a\u4ee5\u901a\u4fd7\u6613\u61c2\u7684\u65b9\u5f0f\u544a\u77e5\u4f60\u9700\u8981\u6536\u96c6\u7684\u4fe1\u606f\u53ca\u7528\u9014\uff0c\u53ea\u5728\u4f60\u786e\u8ba4\u540c\u610f\u540e\u624d\u8fdb\u5165\u540e\u7eed\u767b\u5f55\u3001\u5b9a\u4f4d\u3001\u8d44\u6599\u5b8c\u5584\u4e0e DNA \u6807\u7b7e\u5b9a\u5236\u6d41\u7a0b\u3002',
      intro3: '\u70b9\u51fb\u201c\u540c\u610f\u5e76\u7ee7\u7eed\u201d\u5373\u4ee3\u8868\u4f60\u5df2\u9605\u8bfb\u5e76\u540c\u610f\u300a\u519c\u65c5e\u7ad9\u4e2a\u4eba\u4fe1\u606f\u4fdd\u62a4\u6307\u5f15\u300b\uff0c\u4f60\u4e5f\u53ef\u4ee5\u9009\u62e9\u6682\u4e0d\u540c\u610f\u5e76\u9000\u51fa\u5c0f\u7a0b\u5e8f\u3002',
      disagree: '\u4e0d\u540c\u610f',
      agree: '\u540c\u610f\u5e76\u7ee7\u7eed',
      modalTitle: '\u63d0\u793a',
      modalContent: '\u4e0d\u540c\u610f\u9690\u79c1\u6307\u5f15\u5c06\u65e0\u6cd5\u7ee7\u7eed\u4f7f\u7528\u672c\u5c0f\u7a0b\u5e8f\u3002',
      modalConfirm: '\u9000\u51fa',
      modalCancel: '\u518d\u60f3\u60f3',
    },
  },

  onLoad() {
    const agreed = wx.getStorageSync('agreePrivacy')
    if (agreed) {
      wx.switchTab({
        url: '/pages/home/home',
      })
    }
  },

  onAgreePrivacy() {
    wx.setStorageSync('agreePrivacy', true)
    wx.switchTab({
      url: '/pages/home/home',
    })
  },

  onDisagree() {
    const { text } = this.data
    wx.showModal({
      title: text.modalTitle,
      content: text.modalContent,
      confirmText: text.modalConfirm,
      cancelText: text.modalCancel,
      success: (res) => {
        if (res.confirm) {
          wx.exitMiniProgram()
        }
      },
    })
  },
})
