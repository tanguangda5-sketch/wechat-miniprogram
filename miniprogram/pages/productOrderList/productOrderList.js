const {
  formatCommerceMessage,
  formatFenToYuan,
} = require('../../utils/commerce')

const TAB_CONFIG = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'paid', label: '待发货' },
  { key: 'shipped', label: '待收货' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
  { key: 'closed', label: '已关闭' },
]

const EMPTY_COPY = {
  all: { title: '暂无商品订单', desc: '下单后的商品订单会显示在这里。' },
  pending_payment: { title: '暂无待支付订单', desc: '还没有未支付的商品订单。' },
  paid: { title: '暂无待发货订单', desc: '已支付待发货的订单会显示在这里。' },
  shipped: { title: '暂无待收货订单', desc: '已发货待收货的订单会显示在这里。' },
  completed: { title: '暂无已完成订单', desc: '已确认收货的订单会显示在这里。' },
  cancelled: { title: '暂无已取消订单', desc: '你取消的订单会显示在这里。' },
  closed: { title: '暂无已关闭订单', desc: '超时未支付关闭的订单会显示在这里。' },
}

function formatDateTime(input) {
  if (!input) return ''
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mapOrder(item = {}) {
  const firstItem = (item.items || [])[0] || {}
  return {
    ...item,
    statusClass: item.displayStatusKey || '',
    orderTypeText: '商品订单',
    title: firstItem.title || item.merchantName || '未命名商品',
    cover: firstItem.cover || '/images/default-goods-image.png',
    summary: `${(item.items || []).length}件商品 - ${item.merchantName || '平台自营'}`,
    createdAtText: formatDateTime(item.createdAt),
    payAmountText: formatFenToYuan(item.payAmount, { fallback: '￥0' }),
  }
}

Page({
  data: {
    tabs: TAB_CONFIG,
    currentTab: 'all',
    displayList: [],
    emptyTitle: EMPTY_COPY.all.title,
    emptyDesc: EMPTY_COPY.all.desc,
  },

  onLoad(options) {
    const rawTab = options.tab || 'all'
    this.setData({
      currentTab: TAB_CONFIG.some((item) => item.key === rawTab) ? rawTab : 'all',
    })
  },

  onShow() {
    this.loadOrders()
  },

  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    if (!tab) return
    this.setData({ currentTab: tab }, () => this.loadOrders())
  },

  async loadOrders() {
    const status = this.data.currentTab === 'all' ? '' : this.data.currentTab
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'productOrder',
        data: {
          action: 'listMine',
          status,
          page: 1,
          pageSize: 100,
        },
      })

      if (!res.result || !res.result.success) {
        wx.showToast({
          title: formatCommerceMessage(res.result && res.result.message, '??????'),
          icon: 'none',
        })
        return
      }

      const displayList = ((res.result.data && res.result.data.list) || []).map(mapOrder)
      const copy = EMPTY_COPY[this.data.currentTab] || EMPTY_COPY.all
      this.setData({
        displayList,
        emptyTitle: copy.title,
        emptyDesc: copy.desc,
      })
    } catch (error) {
      console.error('[productOrderList] load failed', error)
      wx.showToast({
        title: '订单加载失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/productOrderDetail/productOrderDetail?id=${id}`,
    })
  },
})
