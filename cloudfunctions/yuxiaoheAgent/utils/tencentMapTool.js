const https = require("https")

const TENCENT_MAP_KEY = process.env.TENCENT_MAP_KEY || process.env.QQ_MAP_KEY || ""

function normalizeText(value) {
  return String(value || "").trim()
}

function normalizeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = ""
        res.on("data", (chunk) => {
          raw += chunk
        })
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw))
          } catch (error) {
            reject(error)
          }
        })
      })
      .on("error", reject)
  })
}

function ensureKey() {
  if (!TENCENT_MAP_KEY) {
    throw new Error("TENCENT_MAP_KEY missing")
  }
}

async function reverseGeocoder(location) {
  ensureKey()
  const latitude = normalizeNumber(location && location.latitude)
  const longitude = normalizeNumber(location && location.longitude)
  if (latitude === null || longitude === null) {
    return null
  }

  const url =
    "https://apis.map.qq.com/ws/geocoder/v1/?output=json&get_poi=0" +
    `&location=${encodeURIComponent(`${latitude},${longitude}`)}` +
    `&key=${encodeURIComponent(TENCENT_MAP_KEY)}`

  const data = await requestJson(url)
  if (!data || data.status !== 0 || !data.result) {
    console.warn("[yuxiaoheAgent][tencentMap] reverseGeocoder failed", data)
    return null
  }

  const addressComponent = data.result.address_component || {}
  const adInfo = data.result.ad_info || {}

  return {
    province: addressComponent.province || adInfo.province || "",
    city: addressComponent.city || adInfo.city || "",
    district: addressComponent.district || adInfo.district || "",
    adcode: String(adInfo.adcode || ""),
    address: data.result.address || "",
    location: data.result.location || { lat: latitude, lng: longitude }
  }
}

async function placeSuggestion(keyword, options = {}) {
  ensureKey()
  const text = normalizeText(keyword)
  if (!text) return []

  const params = [
    `keyword=${encodeURIComponent(text)}`,
    `key=${encodeURIComponent(TENCENT_MAP_KEY)}`,
    "output=json",
    "get_ad=1",
    "region_fix=0",
    "policy=1",
    "page_size=10"
  ]

  const region = normalizeText(options.region)
  if (region) {
    params.push(`region=${encodeURIComponent(region)}`)
  }

  const latitude = normalizeNumber(options.latitude)
  const longitude = normalizeNumber(options.longitude)
  if (latitude !== null && longitude !== null) {
    params.push(`location=${encodeURIComponent(`${latitude},${longitude}`)}`)
  }

  const url = `https://apis.map.qq.com/ws/place/v1/suggestion?${params.join("&")}`
  const data = await requestJson(url)
  if (!data || data.status !== 0 || !Array.isArray(data.data)) {
    console.warn("[yuxiaoheAgent][tencentMap] placeSuggestion failed", data)
    return []
  }

  return data.data.map((item) => ({
    title: item.title || "",
    address: item.address || "",
    type: item.type,
    adcode: String(item.adcode || ""),
    province: item.province || "",
    city: item.city || "",
    district: item.district || "",
    latitude: item.location && item.location.lat,
    longitude: item.location && item.location.lng
  }))
}

async function ipLocation(ip = "") {
  ensureKey()
  const url =
    "https://apis.map.qq.com/ws/location/v1/ip?output=json" +
    (ip ? `&ip=${encodeURIComponent(ip)}` : "") +
    `&key=${encodeURIComponent(TENCENT_MAP_KEY)}`

  const data = await requestJson(url)
  if (!data || data.status !== 0 || !data.result) {
    console.warn("[yuxiaoheAgent][tencentMap] ipLocation failed", data)
    return null
  }

  const adInfo = data.result.ad_info || {}
  return {
    province: adInfo.province || "",
    city: adInfo.city || "",
    district: adInfo.district || "",
    adcode: String(adInfo.adcode || ""),
    location: data.result.location || null
  }
}

async function weatherByAdcode(adcode) {
  ensureKey()
  const code = normalizeText(adcode)
  if (!code) return null

  const url = `https://apis.map.qq.com/ws/weather/v1/?output=json&district_id=${encodeURIComponent(code)}&data_type=all&key=${encodeURIComponent(TENCENT_MAP_KEY)}`
  const data = await requestJson(url)
  console.log("[yuxiaoheAgent][tencentMap] weather request", {
    url,
    status: data && data.status,
    message: data && data.message
  })
  return data && data.status === 0 ? data : null
}

module.exports = {
  reverseGeocoder,
  placeSuggestion,
  ipLocation,
  weatherByAdcode
}
