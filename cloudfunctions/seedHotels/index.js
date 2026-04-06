const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const CLOUD_PREFIX =
  "cloud://cloud1-3ghmr5ki7b1172fe.636c-cloud1-3ghmr5ki7b1172fe-1403917845/hotels"

const LEGACY_DELETE_KEYS = [
  "hotel-lz-yunqi-homestay",
  "hotel-shanye-courtyard-inn",
  "hotel-rural-holiday-resort"
]

function buildHotelAssets(seedKey) {
  return {
    cover: `${CLOUD_PREFIX}/covers/${seedKey}.jpg`,
    banner: `${CLOUD_PREFIX}/banners/${seedKey}.jpg`,
    gallery: [
      `${CLOUD_PREFIX}/gallery/${seedKey}-1.jpg`,
      `${CLOUD_PREFIX}/gallery/${seedKey}-2.jpg`,
      `${CLOUD_PREFIX}/gallery/${seedKey}-3.jpg`
    ]
  }
}

const hotels = [
  {
    seedKey: "hotel-lz-shunshun-sunshine-homestay",
    name: "兰州顺顺阳光民宿",
    title: "兰州顺顺阳光民宿",
    summary: "位于兰州皋兰县的家庭式民宿，房源信息显示主打观景露台、可做饭、可投影和可泡澡，适合短住和朋友结伴入住。",
    desc: "民宿为整套房源，房源信息显示2018年开业，适合偏生活化、自助式入住需求。",
    description:
      "兰州顺顺阳光民宿以整套房源出租为主，房源信息显示的核心卖点包括观景露台、可做饭、可投影、可泡澡。当前页面以已核实的基础信息为主，适合短住休闲和朋友结伴入住。",
    province: "甘肃省",
    city: "兰州市",
    district: "皋兰县",
    address: "甘肃省兰州市皋兰县肽景天下B1段105",
    locationText: "皋兰县肽景天下",
    distanceText: "距截图定位点约1.7公里",
    score: 0,
    commentCount: 0,
    price: 0,
    priceFrom: 0,
    tags: ["观景露台", "可做饭", "可投影", "可泡澡"],
    roomTypes: ["整套民宿"],
    facilities: ["观景露台", "厨房", "投影", "浴缸/泡澡"],
    highlights: ["房源信息显示2018年开业", "整套房源出租", "偏家庭式自助入住", "适合短住休闲"],
    suitableGroups: ["朋友结伴", "情侣", "短住游客"],
    sourceType: "real",
    sort: 1,
    status: true
  },
  {
    seedKey: "hotel-yongjing-liujiaxia-elegant-homestay",
    name: "玩转刘家峡雅致民宿",
    title: "玩转刘家峡雅致民宿(临夏回族自治州店)",
    summary: "位于永靖县的整套房源民宿，房型为1室1厨1卫、50平方米、可住2人，适合去刘家峡周边短住。",
    desc: "房源信息显示该民宿开业时间为2022-03-06，房型为整套房屋，适合两人入住。",
    description:
      "玩转刘家峡雅致民宿位于甘肃省临夏回族自治州永靖县，房型为整套房屋，1室1厨1卫，建筑面积约50平方米，有窗，可住2人，参考价格为215元起。整体更适合两人结伴前往刘家峡周边短住。",
    province: "甘肃省",
    city: "临夏回族自治州",
    district: "永靖县",
    address: "甘肃省临夏回族自治州永靖县安置区祁山路1号楼1单元503室",
    locationText: "永靖县安置区祁山路",
    distanceText: "",
    score: 0,
    commentCount: 0,
    price: 215,
    priceFrom: 215,
    tags: ["整套房屋", "1室1厨1卫", "50㎡", "有窗"],
    roomTypes: ["整套房屋·1室1厨1卫"],
    facilities: ["厨房", "独立卫浴", "有窗", "整套入住"],
    highlights: ["房源信息显示2022-03-06开业", "整套房源更适合短住", "可住2人", "价格信息明确"],
    suitableGroups: ["情侣", "朋友结伴", "两人出游"],
    sourceType: "real",
    sort: 2,
    status: true
  },
  {
    seedKey: "hotel-weizi-courtyard-weipo-xinxu",
    name: "魏紫别院",
    title: "魏紫别院(魏坡新序店)",
    summary: "位于洛阳孟津区魏坡新序附近的高档民宿，院落感强，适合亲子出游、休闲度假和会议团建。",
    desc: "酒店信息显示该民宿2021年开业，位于魏家坡古民居旅游服务中心附近，为高档型民宿。",
    description:
      "魏紫别院(魏坡新序店)位于河南省洛阳市孟津区朝阳镇卫坡村九组魏家坡古民居旅游服务中心向南200米，2021年开业，具备免费停车、早餐、餐饮与活动空间等配套，常见房型参考价格约467元起，并带有茶厅、多功能厅、会议厅等服务标签，整体更适合休闲度假、亲子出游及小型团建活动。",
    province: "河南省",
    city: "洛阳市",
    district: "孟津区",
    address: "河南省洛阳市孟津区朝阳镇卫坡村九组魏家坡古民居旅游服务中心向南200米",
    locationText: "魏坡新序",
    distanceText: "",
    score: 4.8,
    commentCount: 31,
    price: 467,
    priceFrom: 467,
    tags: ["高档民宿", "叫车服务", "茶厅", "多功能厅", "会议厅"],
    roomTypes: ["高级大床房", "高级双床房", "高级庭院大床房"],
    facilities: ["免费停车", "早餐", "餐厅", "茶厅", "多功能厅", "会议厅", "客房WiFi"],
    highlights: ["2021年开业", "靠近魏坡新序", "院落景观感较强", "适合亲子和小团体入住"],
    suitableGroups: ["亲子家庭", "情侣", "朋友结伴", "团建用户"],
    sourceType: "real",
    sort: 3,
    status: true
  },
  {
    seedKey: "hotel-yongjing-centennial-zaoyuan",
    name: "永靖百年枣园民宿",
    title: "永靖百年枣园民宿",
    summary: "位于永靖太极镇大川村的度假型民宿项目，整体环境较新，适合自驾度假、家庭出游和湖区周边休闲住宿。",
    desc: "酒店信息显示该民宿2025年开业，位于太极镇大川村八社001号，整体偏园区型度假住宿。",
    description:
      "永靖百年枣园民宿位于甘肃省临夏回族自治州永靖县太极镇大川村八社001号，具备免费停车、宠物友好、餐厅和叫车服务等配套，常见房型参考价格约788元起，并提供亲子房、大床房、双床房等选择，整体属于偏度假型、园区型的乡野住宿项目。",
    province: "甘肃省",
    city: "临夏回族自治州",
    district: "永靖县",
    address: "甘肃省临夏回族自治州永靖县太极镇大川村八社001号",
    locationText: "太极镇大川村百年枣园",
    distanceText: "",
    score: 4.7,
    commentCount: 31,
    price: 788,
    priceFrom: 788,
    tags: ["宠物友好", "叫车服务", "餐厅", "客房WiFi"],
    roomTypes: ["云曼山合（一室一厅）", "大床房", "双床房"],
    facilities: ["免费停车", "宠物友好", "餐厅", "客房WiFi", "园区休闲空间"],
    highlights: ["2025年开业", "园区型度假住宿", "适合自驾出游", "可联动刘家峡及太极岛周边游玩"],
    suitableGroups: ["亲子家庭", "自驾游客", "朋友结伴", "度假用户"],
    sourceType: "real",
    sort: 4,
    status: true
  }
].map((item) => ({
  ...item,
  ...buildHotelAssets(item.seedKey)
}))

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

async function deleteLegacyHotels(collectionName, seedKeys = []) {
  const collection = db.collection(collectionName)
  let deleted = 0

  for (const seedKey of seedKeys) {
    const query = await collection.where({ seedKey }).get()
    for (const item of query.data || []) {
      await collection.doc(item._id).remove()
      deleted += 1
    }
  }

  return deleted
}

exports.main = async () => {
  const hotelStats = { created: 0, updated: 0 }
  const deleted = await deleteLegacyHotels("hotels", LEGACY_DELETE_KEYS)

  for (const item of hotels) {
    const action = await upsertBySeedKey("hotels", item)
    hotelStats[action] += 1
  }

  return {
    success: true,
    hotels: hotelStats,
    deleted
  }
}
