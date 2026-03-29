const DEFAULT_COVER = "/images/activities/lz-yuzhong-strawberry-family-day.jpg"

const REGION_KEYWORDS = [
  "兰州",
  "天水",
  "酒泉",
  "嘉峪关",
  "张掖",
  "武威",
  "金昌",
  "白银",
  "定西",
  "平凉",
  "庆阳",
  "陇南",
  "临夏",
  "甘南"
]

const COLLECTION_CONFIG = [
  {
    type: "activity",
    collection: "activities",
    fields: [
      "title",
      "summary",
      "content",
      "detail",
      "locationName",
      "province",
      "city",
      "district",
      "transport",
      "stay"
    ],
    tagFields: ["tags", "travelModeTags", "playTags", "suitableGroups", "highlights", "itinerary"]
  },
  {
    type: "scenic",
    collection: "scenics",
    fields: [
      "title",
      "summary",
      "content",
      "locationName",
      "province",
      "city",
      "district",
      "tips",
      "openTime"
    ],
    tagFields: ["tags", "playTags", "suitableGroups", "highlights"]
  },
  {
    type: "product",
    collection: "products",
    fields: [
      "title",
      "summary",
      "content",
      "locationName",
      "province",
      "city",
      "district"
    ],
    tagFields: ["tags", "categoryTags", "suitableGroups", "highlights"]
  },
  {
    type: "hotel",
    collection: "hotels",
    fields: [
      "name",
      "title",
      "summary",
      "desc",
      "description",
      "address",
      "locationText",
      "distanceText",
      "province",
      "city",
      "district"
    ],
    tagFields: ["tags"]
  }
]

function normalizeText(value) {
  return String(value || "").trim()
}

function normalizeLowerText(value) {
  return normalizeText(value).toLowerCase()
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function buildSearchTokens(question) {
  const normalized = normalizeText(question)
  if (!normalized) return []

  const tokens = normalized
    .replace(/[，。！？,.!?/\\]/g, " ")
    .split(/\s+/)
    .filter(Boolean)

  return Array.from(new Set([normalized].concat(tokens)))
}

function extractRegionHints(question, input) {
  const hints = []
  const normalizedQuestion = normalizeText(question)

  REGION_KEYWORDS.forEach((keyword) => {
    if (normalizedQuestion.includes(keyword)) {
      hints.push(keyword)
    }
  })

  ;[input.location.province, input.location.city, input.location.district].forEach((item) => {
    const text = normalizeText(item)
    if (text) hints.push(text.replace(/市|区|县|州/g, ""))
  })

  return Array.from(new Set(hints.filter(Boolean)))
}

function pickCover(item) {
  const candidates = [item.cover].concat(normalizeArray(item.gallery))
  const valid = candidates.find((entry) => {
    const text = normalizeText(entry).toLowerCase()
    return (
      text &&
      !text.includes(".js") &&
      !text.includes(".json") &&
      !text.includes(".wxml") &&
      !text.includes(".wxss")
    )
  })

  return valid || DEFAULT_COVER
}

function joinSearchText(item, config) {
  return config.fields
    .map((field) => item[field])
    .concat(
      config.tagFields.reduce((result, field) => result.concat(normalizeArray(item[field])), [])
    )
    .join(" ")
}

function scoreCandidate(candidate, input) {
  const haystack = normalizeLowerText(joinSearchText(candidate.item, candidate.config))
  let score = 0

  input.tokens.forEach((token) => {
    const lowerToken = normalizeLowerText(token)
    if (!lowerToken) return
    if (haystack.includes(lowerToken)) {
      score += lowerToken.length > 3 ? 4 : 2
    }
  })

  const city = normalizeLowerText(input.location.city)
  const district = normalizeLowerText(input.location.district)
  if (city && haystack.includes(city)) score += 3
  if (district && haystack.includes(district)) score += 2

  input.regionHints.forEach((hint) => {
    const lowerHint = normalizeLowerText(hint)
    if (lowerHint && haystack.includes(lowerHint)) score += 8
  })

  normalizeArray(input.userProfile.dnaTags).forEach((tag) => {
    const lowerTag = normalizeLowerText(tag)
    if (lowerTag && haystack.includes(lowerTag)) score += 1
  })

  const budget = normalizeText(input.preferences.budget)
  const price = Number(candidate.item.priceFrom || candidate.item.price || 0)
  if (budget === "value" && price && price <= 300) score += 1

  return score
}

function toCard(candidate) {
  const { item, type } = candidate
  const price = Number(item.priceFrom || item.price || 0)
  const regionText = [item.province, item.city, item.district].filter(Boolean).join(" / ")
  const title =
    type === "hotel"
      ? normalizeText(item.name || item.title) || "乡野民宿"
      : normalizeText(item.title || item.locationName) || "内容推荐"
  const summary =
    normalizeText(item.summary) ||
    normalizeText(item.content) ||
    normalizeText(item.desc) ||
    normalizeText(item.description)
  const tags = []

  if (type === "activity") {
    tags.push(...normalizeArray(item.tags), ...normalizeArray(item.travelModeTags), ...normalizeArray(item.playTags))
  } else if (type === "scenic") {
    tags.push(...normalizeArray(item.playTags), ...normalizeArray(item.tags))
  } else if (type === "product") {
    tags.push(...normalizeArray(item.categoryTags), ...normalizeArray(item.tags))
  } else {
    tags.push(...normalizeArray(item.tags))
  }

  return {
    id: `${type}:${item._id || item.id || item.seedKey || title}`,
    sourceId: item._id || item.id || "",
    type,
    title,
    summary,
    priceText: price ? (type === "hotel" ? `¥${price}/晚起` : `¥${price}起`) : "",
    regionText: regionText || normalizeText(item.locationName || item.address || item.locationText),
    tags: Array.from(new Set(tags.filter(Boolean))).slice(0, 4),
    cover: pickCover(item)
  }
}

async function safeReadCollection(db, config) {
  try {
    let query = db.collection(config.collection)
    if (config.collection === "hotels") {
      query = query.where({ status: true })
    }
    const res = await query.limit(50).get()
    return (res.data || []).map((item) => ({
      type: config.type,
      item,
      config
    }))
  } catch (error) {
    console.warn(`[yuxiaoheAgent] read collection failed: ${config.collection}`, error.message)
    return []
  }
}

module.exports = async function getContentCandidates(db, input) {
  const tokens = buildSearchTokens(input.question)
  const regionHints = extractRegionHints(input.question, input)
  const allGroups = await Promise.all(COLLECTION_CONFIG.map((config) => safeReadCollection(db, config)))
  const list = allGroups.flat()

  const scored = list
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(candidate, {
        ...input,
        tokens,
        regionHints
      })
    }))
    .sort((a, b) => b.score - a.score)

  const matched = scored.filter((item) => item.score > 0)
  const candidates = (matched.length ? matched : scored).slice(0, 8).map((candidate) => ({
    ...candidate,
    card: toCard(candidate)
  }))
  const fallbackCards = candidates.slice(0, 3).map((candidate) => candidate.card)

  return {
    candidates,
    fallbackCards
  }
}
