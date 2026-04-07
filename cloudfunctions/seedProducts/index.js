const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const DEFAULT_PLATFORM_MERCHANT_OPENID = 'platform-self-operated'
const DEFAULT_PLATFORM_MERCHANT_NAME = 'Platform Store'
const CLOUD_PRODUCT_PREFIX = 'cloud://cloud1-3ghmr5ki7b1172fe.636c-cloud1-3ghmr5ki7b1172fe-1403917845/products'

function buildProductAssets(seedKey) {
  return {
    cover: `${CLOUD_PRODUCT_PREFIX}/covers/${seedKey}.jpg`,
    banner: `${CLOUD_PRODUCT_PREFIX}/banners/${seedKey}.jpg`,
    gallery: [
      `${CLOUD_PRODUCT_PREFIX}/gallery/${seedKey}-1.jpg`,
      `${CLOUD_PRODUCT_PREFIX}/gallery/${seedKey}-2.jpg`,
    ],
  }
}

function toFen(amount) {
  const value = Number(amount || 0)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

function buildCommerceFields(priceYuan, soldCount, shippingFeeYuan = 0, stock = 100) {
  return {
    merchantOpenid: DEFAULT_PLATFORM_MERCHANT_OPENID,
    merchantName: DEFAULT_PLATFORM_MERCHANT_NAME,
    price: toFen(priceYuan),
    shippingFee: toFen(shippingFeeYuan),
    stock,
    lockedStock: 0,
    soldCount,
    status: priceYuan > 0 && stock > 0 ? 'on_sale' : 'draft',
  }
}

const products = [
  {
    seedKey: 'huangshan-free-range-eggs',
    title: 'Free-range eggs',
    summary: 'Daily fresh eggs from mountain farms.',
    content: 'Suitable for family breakfast and daily nutrition.',
    province: 'Anhui',
    city: 'Huangshan',
    district: '',
    locationName: 'Huangshan Farm',
    tags: ['product', 'eggs', 'fresh'],
    categoryTags: ['daily food', 'fresh'],
    suitableGroups: ['family', 'senior', 'healthy diet'],
    sold: 0,
    highlights: ['farm raised', 'fresh source', 'daily staple'],
    sourceType: 'real',
    ...buildProductAssets('huangshan-free-range-eggs'),
    ...buildCommerceFields(0, 0, 0, 0),
  },
  {
    seedKey: 'lz-baihe-gift-box',
    title: 'Lanzhou lily gift box',
    summary: 'Gift box suitable for visiting family and friends.',
    content: 'A local specialty combo for gifting and home use.',
    province: 'Gansu',
    city: 'Lanzhou',
    district: 'Qilihe',
    locationName: 'Lanzhou Specialty House',
    tags: ['product', 'gift box', 'local'],
    categoryTags: ['local food', 'gift box'],
    suitableGroups: ['office worker', 'family'],
    sold: 126,
    highlights: ['local specialty', 'gift friendly', 'ready to ship'],
    sourceType: 'real',
    ...buildProductAssets('lz-baihe-gift-box'),
    ...buildCommerceFields(88, 126, 0, 160),
  },
  {
    seedKey: 'lz-rose-jam',
    title: 'Rose flavor gift pack',
    summary: 'A light snack gift pack with local rose flavor.',
    content: 'Easy to carry and suitable as a small gift.',
    province: 'Gansu',
    city: 'Lanzhou',
    district: 'Yongdeng',
    locationName: 'Rose Workshop',
    tags: ['product', 'rose', 'gift'],
    categoryTags: ['handmade', 'local food'],
    suitableGroups: ['young traveler', 'office worker'],
    sold: 93,
    highlights: ['easy carry', 'rose aroma', 'gift pack'],
    sourceType: 'real',
    ...buildProductAssets('lz-rose-jam'),
    ...buildCommerceFields(56, 93, 0, 120),
  },
  {
    seedKey: 'linxia-handmade-noodle-gift',
    title: 'Handmade noodle combo',
    summary: 'A local flavor combo for family sharing.',
    content: 'Suitable for family dinner and local flavor tasting.',
    province: 'Gansu',
    city: 'Linxia',
    district: 'Linxia City',
    locationName: 'Linxia Food Hall',
    tags: ['product', 'food', 'combo'],
    categoryTags: ['local food', 'family share'],
    suitableGroups: ['family', 'office worker'],
    sold: 148,
    highlights: ['local taste', 'shareable', 'easy cook'],
    sourceType: 'real',
    ...buildProductAssets('linxia-handmade-noodle-gift'),
    ...buildCommerceFields(69, 148, 0, 140),
  },
  {
    seedKey: 'tianshui-apple-gift',
    title: 'Apple gift box',
    summary: 'Seasonal fruit gift box for home and gifting.',
    content: 'Suitable for seasonal fruit gifting and home stock-up.',
    province: 'Gansu',
    city: 'Tianshui',
    district: 'QinAn',
    locationName: 'Fruit Cooperative',
    tags: ['product', 'fruit', 'gift box'],
    categoryTags: ['fresh fruit', 'gift box'],
    suitableGroups: ['family', 'office worker'],
    sold: 172,
    highlights: ['seasonal fruit', 'gift friendly', 'stable quality'],
    sourceType: 'real',
    ...buildProductAssets('tianshui-apple-gift'),
    ...buildCommerceFields(99, 172, 0, 180),
  },
  {
    seedKey: 'zhangye-coarse-grain-box',
    title: 'Coarse grain health box',
    summary: 'A healthy combo for family daily meals.',
    content: 'Suitable for healthy diet and family stock-up.',
    province: 'Gansu',
    city: 'Zhangye',
    district: 'Ganzhou',
    locationName: 'Zhangye Store',
    tags: ['product', 'grain', 'health'],
    categoryTags: ['local food', 'gift box'],
    suitableGroups: ['family', 'senior'],
    sold: 137,
    highlights: ['healthy combo', 'family pack', 'gift friendly'],
    sourceType: 'real',
    ...buildProductAssets('zhangye-coarse-grain-box'),
    ...buildCommerceFields(79, 137, 0, 150),
  },
]

async function upsertBySeedKey(collectionName, item, allowOverwrite = false) {
  const collection = db.collection(collectionName)
  const payload = {
    ...item,
    updatedAt: db.serverDate(),
  }

  try {
    const exists = await collection.where({ seedKey: item.seedKey }).limit(1).get()

    if (exists.data.length) {
      if (!allowOverwrite) {
        return 'skipped'
      }

      await collection.doc(exists.data[0]._id).update({ data: payload })
      return 'updated'
    }
  } catch (error) {
    const message = String((error && error.message) || '')
    const isCollectionMissing =
      message.includes('collection not exists') ||
      message.includes('DATABASE_COLLECTION_NOT_EXIST') ||
      message.includes('Db or Table not exist')

    if (!isCollectionMissing) {
      throw error
    }
  }

  await collection.add({
    data: {
      ...payload,
      createdAt: db.serverDate(),
    },
  })
  return 'created'
}

exports.main = async (event = {}) => {
  const productStats = { created: 0, updated: 0, skipped: 0 }
  const allowOverwrite = !!event.allowOverwrite

  for (const item of products) {
    const action = await upsertBySeedKey('products', item, allowOverwrite)
    productStats[action] += 1
  }

  return {
    success: true,
    products: productStats,
  }
}
