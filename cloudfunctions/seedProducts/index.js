const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const CLOUD_PRODUCT_PREFIX = "cloud://cloud1-3ghmr5ki7b1172fe.636c-cloud1-3ghmr5ki7b1172fe-1403917845/products"

function buildProductAssets(seedKey) {
  return {
    cover: `${CLOUD_PRODUCT_PREFIX}/covers/${seedKey}.jpg`,
    banner: `${CLOUD_PRODUCT_PREFIX}/banners/${seedKey}.jpg`,
    gallery: [
      `${CLOUD_PRODUCT_PREFIX}/gallery/${seedKey}-1.jpg`,
      `${CLOUD_PRODUCT_PREFIX}/gallery/${seedKey}-2.jpg`
    ]
  }
}

const products = [
  {
    seedKey: "huangshan-free-range-eggs",
    title: "黄山土鸡蛋",
    summary: "源自安徽黄山山区散养土鸡，自然觅食、生态养殖，适合家庭日常营养与健康饮食。",
    content: "黄山土鸡蛋来自山林散养环境，鸡群以谷物、虫草与山泉为主要食源，蛋黄饱满橙黄、蛋白浓稠Q弹、蛋香浓郁。适合作为家庭常备鲜食，也适合儿童辅食、孕产营养补充和银发养生场景。",
    province: "安徽省",
    city: "黄山市",
    district: "",
    locationName: "黄山生态散养农场",
    tags: ["商品", "土鸡蛋", "生态养殖"],
    categoryTags: ["健康食材", "日常鲜货"],
    suitableGroups: ["宝宝辅食家庭", "孕产人群", "银发族", "健康饮食家庭"],
    price: 0,
    sold: 0,
    highlights: [
      "山林散养，自然觅食",
      "无激素、无抗生素",
      "蛋黄橙黄饱满，蛋白浓稠",
      "适合全家日常营养补充"
    ],
    cover: buildProductAssets("huangshan-free-range-eggs").cover,
    gallery: buildProductAssets("huangshan-free-range-eggs").gallery,
    banner: buildProductAssets("huangshan-free-range-eggs").banner,
    sourceType: "real"
  },
  {
    seedKey: "lz-baihe-gift-box",
    title: "兰州百合伴手礼盒",
    summary: "适合送礼和节庆走亲访友的兰州特色礼盒。",
    content: "精选兰州百合相关产品组合，适合作为乡味伴手礼与节气送礼选择。",
    province: "甘肃省",
    city: "兰州市",
    district: "七里河区",
    locationName: "兰州乡味精选馆",
    tags: ["商品", "特产", "礼盒"],
    categoryTags: ["乡味特产", "节气礼盒"],
    suitableGroups: ["都市白领", "亲子家庭", "银发族"],
    price: 88,
    sold: 126,
    highlights: [
      "兰州地方特色明显",
      "适合送礼",
      "包装友好"
    ],
    cover: buildProductAssets("lz-baihe-gift-box").cover,
    gallery: buildProductAssets("lz-baihe-gift-box").gallery,
    banner: buildProductAssets("lz-baihe-gift-box").banner
  },
  {
    seedKey: "lz-rose-jam",
    title: "永登玫瑰酱礼装",
    summary: "带有甘肃玫瑰风味的手作伴手礼。",
    content: "以永登玫瑰原料为灵感，适合喜欢清甜花香风味的用户。",
    province: "甘肃省",
    city: "兰州市",
    district: "永登县",
    locationName: "永登玫瑰工坊",
    tags: ["商品", "手作", "伴手礼"],
    categoryTags: ["手工工坊", "乡味特产"],
    suitableGroups: ["都市白领", "青年社交游"],
    price: 56,
    sold: 93,
    highlights: [
      "适合女性用户送礼",
      "花香风味鲜明",
      "小规格便于携带"
    ],
    cover: buildProductAssets("lz-rose-jam").cover,
    gallery: buildProductAssets("lz-rose-jam").gallery,
    banner: buildProductAssets("lz-rose-jam").banner
  },
  {
    seedKey: "linxia-handmade-noodle-gift",
    title: "临夏手工面点组合",
    summary: "临夏风味浓郁的地方面食组合装。",
    content: "集合临夏风味面点与地方特色搭配，更适合作为家庭分享型商品。",
    province: "甘肃省",
    city: "临夏回族自治州",
    district: "临夏市",
    locationName: "临夏乡味馆",
    tags: ["商品", "美食", "地方风味"],
    categoryTags: ["乡村美食", "乡味特产"],
    suitableGroups: ["亲子家庭", "银发族", "都市白领"],
    price: 69,
    sold: 148,
    highlights: [
      "地方风味明显",
      "适合家庭分享",
      "搭配方便"
    ],
    cover: buildProductAssets("linxia-handmade-noodle-gift").cover,
    gallery: buildProductAssets("linxia-handmade-noodle-gift").gallery,
    banner: buildProductAssets("linxia-handmade-noodle-gift").banner
  },
  {
    seedKey: "tianshui-apple-gift",
    title: "天水苹果鲜果礼盒",
    summary: "适合节气送礼和家庭囤货的鲜果礼盒。",
    content: "以天水果香风味和品质果品为卖点，适合作为季节性伴手礼。",
    province: "甘肃省",
    city: "天水市",
    district: "秦安县",
    locationName: "秦安果品合作社",
    tags: ["商品", "鲜果", "礼盒"],
    categoryTags: ["乡味特产", "节气礼盒"],
    suitableGroups: ["亲子家庭", "都市白领", "银发族"],
    price: 99,
    sold: 172,
    highlights: [
      "时令鲜果品质稳定",
      "适合送礼",
      "包装完整"
    ],
    cover: buildProductAssets("tianshui-apple-gift").cover,
    gallery: buildProductAssets("tianshui-apple-gift").gallery,
    banner: buildProductAssets("tianshui-apple-gift").banner
  },
  {
    seedKey: "gannan-yak-yogurt",
    title: "甘南牦牛酸奶风味组",
    summary: "高原牧场风味延伸出的特色乳品组合。",
    content: "适合对甘南牧场风味感兴趣的用户，兼具地方特色与轻量尝鲜体验。",
    province: "甘肃省",
    city: "甘南藏族自治州",
    district: "夏河县",
    locationName: "甘南牧场风味站",
    tags: ["商品", "牧场风味", "轻食"],
    categoryTags: ["乡村美食", "地方风味"],
    suitableGroups: ["青年社交游", "都市白领"],
    price: 49,
    sold: 81,
    highlights: [
      "高原风味鲜明",
      "适合尝鲜",
      "包装轻便"
    ],
    cover: buildProductAssets("gannan-yak-yogurt").cover,
    gallery: buildProductAssets("gannan-yak-yogurt").gallery,
    banner: buildProductAssets("gannan-yak-yogurt").banner
  },
  {
    seedKey: "zhangye-coarse-grain-box",
    title: "张掖杂粮健康礼盒",
    summary: "兼顾送礼与日常囤货的乡味杂粮组合。",
    content: "主打张掖产地杂粮和健康搭配，适合送给长辈或注重饮食均衡的人群。",
    province: "甘肃省",
    city: "张掖市",
    district: "甘州区",
    locationName: "张掖乡味商城",
    tags: ["商品", "杂粮", "健康"],
    categoryTags: ["乡味特产", "礼盒"],
    suitableGroups: ["银发族", "亲子家庭", "都市白领"],
    price: 79,
    sold: 137,
    highlights: [
      "健康取向明确",
      "适合家庭囤货",
      "送礼体面"
    ],
    cover: buildProductAssets("zhangye-coarse-grain-box").cover,
    gallery: buildProductAssets("zhangye-coarse-grain-box").gallery,
    banner: buildProductAssets("zhangye-coarse-grain-box").banner
  }
]

async function upsertBySeedKey(collectionName, item) {
  const collection = db.collection(collectionName)
  const payload = {
    ...item,
    updatedAt: db.serverDate()
  }

  try {
    const exists = await collection.where({ seedKey: item.seedKey }).limit(1).get()

    if (exists.data.length) {
      await collection.doc(exists.data[0]._id).update({ data: payload })
      return "updated"
    }
  } catch (error) {
    const message = String((error && error.message) || "")
    const isCollectionMissing =
      message.includes("collection not exists") ||
      message.includes("DATABASE_COLLECTION_NOT_EXIST") ||
      message.includes("Db or Table not exist")

    if (!isCollectionMissing) {
      throw error
    }
  }

  await collection.add({
    data: {
      ...payload,
      createdAt: db.serverDate()
    }
  })
  return "created"
}

exports.main = async () => {
  const productStats = { created: 0, updated: 0 }

  for (const item of products) {
    const action = await upsertBySeedKey("products", item)
    productStats[action] += 1
  }

  return {
    success: true,
    products: productStats
  }
}
