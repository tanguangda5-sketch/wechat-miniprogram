const {
  formatCommerceMessage,
  formatFenToYuan,
} = require('../../utils/commerce')

Page({
  data: {
    groups: [],
    loading: false,
    empty: true,
    summaryText: '￥0',
    selectedCount: 0,
  },

  onShow() {
    this.loadCart()
  },

  async loadCart() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'productCart',
        data: {
          action: 'list',
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: formatCommerceMessage(res.result && res.result.message, '购物车加载失败'),
          icon: 'none',
        })
        return
      }

      const groups = this.decorateGroups((res.result.data && res.result.data.groups) || [])
      this.setData({
        groups,
        empty: groups.length === 0,
      })
      this.buildSummary(groups)
    } catch (error) {
      console.error('[cart] load failed', error)
      wx.showToast({
        title: '购物车加载失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  decorateGroups(groups = []) {
    return groups.map((group) => ({
      ...group,
      items: (group.items || []).map((item) => ({
        ...item,
        subtotalFen: Number((item.productSnapshot && item.productSnapshot.price) || 0) * Number(item.quantity || 0),
        subtotalText: formatFenToYuan(Number((item.productSnapshot && item.productSnapshot.price) || 0) * Number(item.quantity || 0), {
          fallback: '￥0',
        }),
        unitPriceText: formatFenToYuan((item.productSnapshot && item.productSnapshot.price) || 0, {
          fallback: '￥0',
        }),
      })),
    }))
  },

  buildSummary(groups = this.data.groups) {
    let totalFen = 0
    let selectedCount = 0

    groups.forEach((group) => {
      ;(group.items || []).forEach((item) => {
        if (item.selected && item.isPurchasable) {
          selectedCount += 1
          totalFen += Number(item.subtotalFen || 0)
        }
      })
    })

    this.setData({
      summaryText: formatFenToYuan(totalFen, { fallback: '￥0' }),
      selectedCount,
    })
  },

  async toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const selected = !!e.currentTarget.dataset.selected
    await this.runCartAction('toggleSelect', {
      cartItemId: id,
      selected: !selected,
    })
  },

  async changeQuantity(e) {
    const id = e.currentTarget.dataset.id
    const quantity = Number(e.currentTarget.dataset.quantity || 0)
    const delta = Number(e.currentTarget.dataset.delta || 0)
    const nextQuantity = quantity + delta
    if (nextQuantity <= 0) {
      return
    }
    await this.runCartAction('updateQty', {
      cartItemId: id,
      quantity: nextQuantity,
    })
  },

  async removeItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除商品',
      content: '确认将这个商品移出购物车吗？',
      success: async (res) => {
        if (!res.confirm) return
        await this.runCartAction('remove', {
          cartItemId: id,
        })
      },
    })
  },

  async runCartAction(action, payload) {
    wx.showLoading({ title: '处理中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'productCart',
        data: {
          action,
          ...payload,
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: formatCommerceMessage(res.result && res.result.message, '操作失败'),
          icon: 'none',
        })
        return
      }

      await this.loadCart()
    } catch (error) {
      console.error('[cart] action failed', action, error)
      wx.showToast({
        title: '操作失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },

  goCheckout() {
    const selectedGroups = this.data.groups
      .map((group) => ({
        merchantOpenid: group.merchantOpenid,
        selectedItems: (group.items || []).filter((item) => item.selected && item.isPurchasable),
      }))
      .filter((group) => group.selectedItems.length > 0)

    if (!selectedGroups.length) {
      wx.showToast({
        title: '请先选择商品',
        icon: 'none',
      })
      return
    }

    if (selectedGroups.length > 1) {
      wx.showToast({
        title: '暂不支持跨商家合并结算',
        icon: 'none',
      })
      return
    }

    wx.navigateTo({
      url: '/pages/confirmOrder/confirmOrder?source=cart',
    })
  },

  goMall() {
    wx.navigateTo({
      url: '/pages/mall/mall',
    })
  },
})
