function mapReviewMessage(message) {
  const messageMap = {
    ORDER_CANNOT_REVIEW: 'This order cannot be reviewed now',
    REVIEW_CONTENT_REQUIRED: 'Please enter review content',
    ORDER_NOT_FOUND: 'Order not found',
  }

  return messageMap[message] || message || 'Submit failed'
}

Page({
  data: {
    id: '',
    score: 5,
    content: '',
  },

  onLoad(options) {
    this.setData({ id: options.id || '' })
  },

  setScore(e) {
    this.setData({ score: Number(e.currentTarget.dataset.score) })
  },

  onInput(e) {
    this.setData({ content: e.detail.value })
  },

  async submitReview() {
    const { id, score, content } = this.data
    if (!content.trim()) {
      wx.showToast({ title: 'Review content is required', icon: 'none' })
      return
    }

    wx.showLoading({ title: 'Submitting' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'activityOrder',
        data: {
          action: 'submitReview',
          id,
          score,
          content: content.trim(),
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({ title: mapReviewMessage(res.result && res.result.message), icon: 'none' })
        return
      }

      wx.showToast({ title: 'Review submitted', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (error) {
      console.error('[activityReview] submit failed', error)
      wx.showToast({ title: 'Submit failed', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
})
