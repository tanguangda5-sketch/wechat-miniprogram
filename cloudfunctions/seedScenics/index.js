const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const SCENIC_COVER = "/images/nav-academy.png"

const scenics = [
  {
    seedKey: "lz-hekou-pear-blossom-scenic",
    title: "兰州河口古镇梨花漫游",
    summary: "春季适合赏花拍照与古镇漫行的轻松景点。",
    content: "以河口古镇周边梨花景观和老街漫游为核心，适合周末短途、亲子同行与摄影打卡。",
    province: "甘肃省",
    city: "兰州市",
    district: "西固区",
    locationName: "河口古镇梨花观景区",
    tags: ["景点", "古镇", "花海", "周末短途"],
    playTags: ["生态观光", "创意摄影", "古村漫游"],
    suitableGroups: ["亲子家庭", "都市白领", "青年社交游"],
    priceFrom: 0,
    openTime: "09:00-18:00",
    highlights: [
      "梨花花期适合赏景与拍照",
      "古镇街巷适合慢游打卡",
      "可与周边乡味美食串联游玩"
    ],
    tips: "建议花期晴天前往，拍照效果更好。",
    cover: SCENIC_COVER,
    gallery: [SCENIC_COVER]
  },
  {
    seedKey: "lz-yuzhong-xinglong-mountain-scenic",
    title: "榆中兴隆山林步道观景",
    summary: "适合轻徒步、观景和周末放松的山野景点。",
    content: "兴隆山一带兼具森林步道、山野景观和清凉气候，适合周末短途与朋友结伴休闲出行。",
    province: "甘肃省",
    city: "兰州市",
    district: "榆中县",
    locationName: "兴隆山山野观景区",
    tags: ["景点", "山野", "轻徒步"],
    playTags: ["生态观光", "栖居山野", "创意摄影"],
    suitableGroups: ["都市白领", "青年社交游", "老友结伴行"],
    priceFrom: 45,
    openTime: "08:30-17:30",
    highlights: [
      "山野空气清新，适合半天慢游",
      "林间步道适合轻徒步",
      "观景点适合拍照"
    ],
    tips: "建议带一件防风外套，山上温差较大。",
    cover: SCENIC_COVER,
    gallery: [SCENIC_COVER]
  },
  {
    seedKey: "linxia-bingling-lake-scenic",
    title: "临夏炳灵湖黄河风光轻游",
    summary: "黄河库区景观与临夏风情兼具的休闲观光路线。",
    content: "以黄河水域景观和临夏周边乡村风光为特色，适合自驾观景和拍照打卡。",
    province: "甘肃省",
    city: "临夏回族自治州",
    district: "永靖县",
    locationName: "炳灵湖风景带",
    tags: ["景点", "黄河风光", "观景"],
    playTags: ["生态观光", "创意摄影"],
    suitableGroups: ["都市白领", "青年社交游"],
    priceFrom: 68,
    openTime: "09:00-18:00",
    highlights: [
      "黄河风光开阔，适合观景",
      "适合自驾串联临夏美食",
      "打卡氛围轻松"
    ],
    tips: "自驾体验更好，可顺带安排临夏美食。",
    cover: SCENIC_COVER,
    gallery: [SCENIC_COVER]
  },
  {
    seedKey: "tianshui-maiji-rural-scenic",
    title: "天水麦积乡野田园漫游",
    summary: "田园风光与乡村步道结合的周边休闲景点。",
    content: "适合周末短途和亲子慢游，能体验天水乡野景观与季节性果园风貌。",
    province: "甘肃省",
    city: "天水市",
    district: "麦积区",
    locationName: "麦积乡野田园观景带",
    tags: ["景点", "田园", "漫游"],
    playTags: ["生态观光", "古村漫游"],
    suitableGroups: ["亲子家庭", "都市白领"],
    priceFrom: 0,
    openTime: "全天开放",
    highlights: [
      "适合家庭轻松散步",
      "季节性景观变化明显",
      "适合与采摘活动结合"
    ],
    tips: "适合春夏季前往，景观更丰富。",
    cover: SCENIC_COVER,
    gallery: [SCENIC_COVER]
  },
  {
    seedKey: "zhangye-danxia-rural-view",
    title: "张掖乡野丹霞观景线",
    summary: "适合摄影与自然观光的甘肃特色景点。",
    content: "围绕张掖周边地貌景观与乡野休闲点展开，适合摄影爱好者与周边慢游用户。",
    province: "甘肃省",
    city: "张掖市",
    district: "临泽县",
    locationName: "张掖乡野丹霞观景带",
    tags: ["景点", "摄影", "自然风光"],
    playTags: ["创意摄影", "生态观光"],
    suitableGroups: ["青年社交游", "都市白领"],
    priceFrom: 120,
    openTime: "08:00-19:00",
    highlights: [
      "地貌景观极具视觉冲击力",
      "适合摄影打卡",
      "可结合民宿慢游"
    ],
    tips: "日落前后光线更适合拍摄。",
    cover: SCENIC_COVER,
    gallery: [SCENIC_COVER]
  },
  {
    seedKey: "gannan-grassland-view",
    title: "甘南草原牧场观景体验",
    summary: "草原景观与牧场文化结合的轻体验景点。",
    content: "以草原观景、牧场互动和高原风光体验为特色，更适合想感受甘南自然氛围的用户。",
    province: "甘肃省",
    city: "甘南藏族自治州",
    district: "夏河县",
    locationName: "甘南草原牧场观景区",
    tags: ["景点", "草原", "牧场"],
    playTags: ["生态观光", "创意摄影", "体验游"],
    suitableGroups: ["青年社交游", "老友结伴行", "都市白领"],
    priceFrom: 98,
    openTime: "08:30-18:30",
    highlights: [
      "草原景观开阔",
      "适合感受牧场氛围",
      "适合摄影与慢游"
    ],
    tips: "注意防晒和保暖，提前适应高原气候。",
    cover: SCENIC_COVER,
    gallery: [SCENIC_COVER]
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
  const scenicStats = { created: 0, updated: 0 }

  for (const item of scenics) {
    const action = await upsertBySeedKey("scenics", item)
    scenicStats[action] += 1
  }

  return {
    success: true,
    scenics: scenicStats
  }
}
