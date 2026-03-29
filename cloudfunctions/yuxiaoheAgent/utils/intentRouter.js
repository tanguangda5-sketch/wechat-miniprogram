const WEATHER_KEYWORDS = [
  "天气",
  "气温",
  "温度",
  "下雨",
  "降雨",
  "雨吗",
  "冷不冷",
  "热不热",
  "刮风",
  "风大",
  "穿什么",
  "穿啥",
  "天气预报"
]

const LOCATION_KEYWORDS = [
  "我在哪",
  "我现在在哪",
  "我现在在哪里",
  "当前位置",
  "你知道我在哪",
  "知道我现在在哪",
  "我在什么地方",
  "我在哪儿"
]

const PLATFORM_KEYWORDS = [
  "活动",
  "景点",
  "民宿",
  "酒店",
  "住宿",
  "商品",
  "特产",
  "礼盒",
  "乡味",
  "周边",
  "附近",
  "攻略",
  "路线",
  "采摘",
  "打卡",
  "推荐"
]

function normalizeText(value) {
  return String(value || "").trim()
}

module.exports = function routeIntent(question) {
  const text = normalizeText(question)

  if (!text) {
    return { intent: "empty" }
  }

  if (WEATHER_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return { intent: "weather" }
  }

  if (LOCATION_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return { intent: "where_am_i" }
  }

  if (PLATFORM_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return { intent: "platform" }
  }

  return { intent: "general" }
}
