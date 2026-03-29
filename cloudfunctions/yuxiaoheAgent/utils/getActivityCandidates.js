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

function joinSearchText(activity) {
  return [
    activity.title,
    activity.summary,
    activity.content,
    activity.detail,
    activity.locationName,
    activity.province,
    activity.city,
    activity.district
  ]
    .concat(normalizeArray(activity.tags))
    .concat(normalizeArray(activity.travelModeTags))
    .concat(normalizeArray(activity.playTags))
    .concat(normalizeArray(activity.suitableGroups))
    .join(" ")
}

function scoreActivity(activity, input) {
  const haystack = normalizeLowerText(joinSearchText(activity))
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
    if (lowerHint && haystack.includes(lowerHint)) {
      score += 8
    }
  })

  normalizeArray(input.userProfile.dnaTags).forEach((tag) => {
    const lowerTag = normalizeLowerText(tag)
    if (lowerTag && haystack.includes(lowerTag)) score += 1
  })

  const distance = normalizeText(input.preferences.distance)
  if (distance === "near") score += 1

  const budget = normalizeText(input.preferences.budget)
  if (budget === "value") {
    const price = Number(activity.priceFrom || activity.price || 0)
    if (price && price <= 300) score += 1
  }

  return score
}

function pickCover(activity) {
  const cover = normalizeText(activity.cover)
  if (!cover) return DEFAULT_COVER

  const invalidPatterns = [
    ".js",
    ".wxml",
    ".wxss",
    ".json",
    "collapse",
    "customCard",
    "feedback",
    "wd-markdown",
    "index.wxml"
  ]

  const lower = cover.toLowerCase()
  if (invalidPatterns.some((pattern) => lower.includes(pattern.toLowerCase()))) {
    return DEFAULT_COVER
  }

  return cover
}

module.exports = async function getActivityCandidates(db, input) {
  const res = await db.collection("activities").limit(50).get()
  const list = res.data || []
  const tokens = buildSearchTokens(input.question)
  const regionHints = extractRegionHints(input.question, input)

  const scored = list
    .map((activity) => ({
      activity,
      score: scoreActivity(activity, {
        ...input,
        tokens,
        regionHints
      })
    }))
    .sort((a, b) => b.score - a.score)

  const matched = scored.filter((item) => item.score > 0).map((item) => item.activity)
  const candidates = (matched.length ? matched : list).slice(0, 6)

  return {
    candidates,
    fallbackCards: candidates.slice(0, 3).map((activity) => {
      const price = Number(activity.priceFrom || activity.price || 0)
      return {
        id: activity._id || "",
        type: "activity",
        title: activity.title || "Activity",
        summary: activity.summary || activity.content || "",
        priceText: price ? `CNY ${price}+` : "Price TBD",
        regionText: [activity.province, activity.city, activity.district].filter(Boolean).join(" / "),
        tags: normalizeArray(activity.tags).slice(0, 3),
        cover: pickCover(activity)
      }
    })
  }
}
