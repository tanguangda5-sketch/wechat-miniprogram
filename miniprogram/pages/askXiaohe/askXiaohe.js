Page({
  data: {
    text: {
      title: "问小禾",
      subtitle: "问附近推荐、玩法灵感和路线建议"
    }
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }

    wx.navigateTo({
      url: "/pages/search/search"
    })
  },

  goChat() {
    wx.navigateTo({
      url: "/pages/askXiaoheChat/askXiaoheChat"
    })
  }
})
