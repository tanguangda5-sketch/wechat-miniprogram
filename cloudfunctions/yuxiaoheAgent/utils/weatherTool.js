const https = require("https")
const { placeSuggestion, reverseGeocoder, ipLocation } = require("./tencentMapTool")

function normalizeText(value) {
  return String(value || "").trim()
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function formatNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? String(Math.round(number)) : ""
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

function detectPlaceKeyword(question) {
  const text = normalizeText(question)
  if (!text) return ""

  const cleaned = text
    .replace(/(今天天气怎么样|天气怎么样|天气如何|天气咋样)/g, "")
    .replace(/(今天|现在|这两天|这周末|天气|气温|温度|会下雨|下雨|冷不冷|热不热|怎么样|如何|咋样|适合穿什么)/g, "")
    .replace(/^(请问|帮我看下|帮我看看|帮我查下|帮我查查)/g, "")
    .trim()

  const exactAdminMatch = cleaned.match(/([\u4e00-\u9fa5]{2,12}(?:省|市|州|县|区))/)
  if (exactAdminMatch && exactAdminMatch[1]) {
    return exactAdminMatch[1]
  }

  const firstPhrase = cleaned.split(/[,\uFF0C\u3002\uFF1F?!！\s]/).find(Boolean)
  if (firstPhrase) {
    const concisePhrase = firstPhrase.replace(/(可以|给我|推荐|一些|适合|这个|活动|景点|民宿|酒店|去哪|安排|吗|呀|呢)/g, "").trim()
    if (concisePhrase.length >= 2) {
      return concisePhrase
    }
  }

  const phraseParts = cleaned
    .split(/[的\s,，。？?！!]/)
    .map((item) => item.replace(/(可以|给我|推荐|一些|适合|这个|活动|景点|民宿|酒店|去哪|安排|吗|呀|呢)/g, "").trim())
    .filter(Boolean)
  if (phraseParts.length) {
    return phraseParts[0]
  }

  return ""
}

function pickBestSuggestion(suggestions, explicitPlace) {
  const keyword = normalizeText(explicitPlace)
  const normalizedList = normalizeArray(suggestions)

  const exactAdmin = normalizedList.find((item) => {
    const title = normalizeText(item.title)
    return item.type === 4 && (title === keyword || `${title}市` === keyword || title === keyword.replace(/市$/, ""))
  })
  if (exactAdmin) return exactAdmin

  const adminItem =
    normalizedList.find((item) => item.type === 4 && normalizeText(item.title)) ||
    normalizedList.find((item) => item.type === 3 && normalizeText(item.title))
  if (adminItem) return adminItem

  const districtLike = normalizedList.find((item) => item.city && item.district && item.type !== 0)
  if (districtLike) return districtLike

  return normalizedList[0] || null
}

function buildDisplayLabel(resolved, explicitPlace) {
  const city = normalizeText(resolved && resolved.city)
  const district = normalizeText(resolved && resolved.district)
  const title = normalizeText(resolved && resolved.title)
  const label = normalizeText(resolved && resolved.label)
  const explicit = normalizeText(explicitPlace)

  if (city) return city
  if (district) return district
  if (title) return title
  if (label) return label
  if (explicit) return /[省市州县区]$/.test(explicit) ? explicit : `${explicit}市`
  return "该地区"
}

async function resolveLocation(input) {
  const explicitPlace = detectPlaceKeyword(input.question)
  const region = [input.location.province, input.location.city, input.location.district].filter(Boolean).join("")

  if (explicitPlace) {
    console.log("[yuxiaoheAgent][weatherTool] detected explicit place", { explicitPlace })

    const attempts = [
      { region: explicitPlace },
      region ? { region } : null,
      {}
    ].filter(Boolean)

    for (const options of attempts) {
      const suggestions = await placeSuggestion(explicitPlace, options)
      if (suggestions.length) {
        const picked = pickBestSuggestion(suggestions, explicitPlace)
        console.log("[yuxiaoheAgent][weatherTool] placeSuggestion picked", {
          explicitPlace,
          options,
          picked,
          suggestions: suggestions.slice(0, 5)
        })
        return {
          source: "suggestion",
          explicitPlace,
          title: picked.title,
          label: [picked.province, picked.city, picked.district].filter(Boolean).join(""),
          adcode: picked.adcode,
          province: picked.province,
          city: picked.city,
          district: picked.district,
          latitude: picked.latitude,
          longitude: picked.longitude
        }
      }
    }

    console.warn("[yuxiaoheAgent][weatherTool] explicit place not resolved", { explicitPlace })
    return null
  }

  if (input.location.latitude && input.location.longitude) {
    const reversed = await reverseGeocoder({
      latitude: input.location.latitude,
      longitude: input.location.longitude
    })
    if (reversed) {
      return {
        source: "reverseGeocoder",
        explicitPlace,
        title: reversed.city || reversed.district || reversed.province || "",
        label: [reversed.province, reversed.city, reversed.district].filter(Boolean).join(""),
        adcode: reversed.adcode,
        province: reversed.province,
        city: reversed.city,
        district: reversed.district,
        latitude: reversed.location && reversed.location.lat,
        longitude: reversed.location && reversed.location.lng
      }
    }
  }

  if (input.location.city || input.location.district) {
    const fallbackKeyword = normalizeText(input.location.city || input.location.district)
    const suggestions = await placeSuggestion(fallbackKeyword, { region })
    if (suggestions.length) {
      const picked = suggestions[0]
      return {
        source: "locationFieldSuggestion",
        explicitPlace,
        title: picked.title,
        label: [picked.province, picked.city, picked.district].filter(Boolean).join(""),
        adcode: picked.adcode,
        province: picked.province,
        city: picked.city,
        district: picked.district,
        latitude: picked.latitude,
        longitude: picked.longitude
      }
    }
  }

  const ipResolved = await ipLocation("")
  if (ipResolved) {
    return {
      source: "ipLocation",
      explicitPlace,
      title: ipResolved.city || ipResolved.district || ipResolved.province || "",
      label: [ipResolved.province, ipResolved.city, ipResolved.district].filter(Boolean).join(""),
      adcode: ipResolved.adcode,
      province: ipResolved.province,
      city: ipResolved.city,
      district: ipResolved.district,
      latitude: ipResolved.location && ipResolved.location.lat,
      longitude: ipResolved.location && ipResolved.location.lng
    }
  }

  return null
}

async function fetchOpenMeteoWeather(latitude, longitude) {
  const url =
    "https://api.open-meteo.com/v1/forecast?forecast_days=1&timezone=Asia%2FShanghai" +
    `&latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation" +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max"

  return requestJson(url)
}

function mapWeatherCode(code) {
  const mapping = {
    0: "晴",
    1: "大体晴朗",
    2: "多云",
    3: "阴",
    45: "有雾",
    48: "雾凇",
    51: "小毛毛雨",
    53: "毛毛雨",
    55: "较强毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "小阵雨",
    81: "阵雨",
    82: "强阵雨",
    95: "雷阵雨"
  }
  return mapping[Number(code)] || "天气情况待确认"
}

function buildWeatherAnswer(locationLabel, weatherData) {
  const current = weatherData && weatherData.current ? weatherData.current : {}
  const daily = weatherData && weatherData.daily ? weatherData.daily : {}

  const weatherText = mapWeatherCode(current.weather_code)
  const temp = formatNumber(current.temperature_2m)
  const feelTemp = formatNumber(current.apparent_temperature)
  const minTemp = Array.isArray(daily.temperature_2m_min) ? formatNumber(daily.temperature_2m_min[0]) : ""
  const maxTemp = Array.isArray(daily.temperature_2m_max) ? formatNumber(daily.temperature_2m_max[0]) : ""
  const rainProb = Array.isArray(daily.precipitation_probability_max)
    ? formatNumber(daily.precipitation_probability_max[0])
    : ""
  const wind = formatNumber(current.wind_speed_10m)
  const updateTime = normalizeText(current.time)

  const parts = []
  const metrics = []
  if (temp) metrics.push(`当前约 ${temp}°C`)
  if (feelTemp) metrics.push(`体感约 ${feelTemp}°C`)
  if (minTemp && maxTemp) metrics.push(`今天 ${minTemp}°C - ${maxTemp}°C`)
  if (wind) metrics.push(`风速约 ${wind} km/h`)

  const prefix = `${locationLabel}${updateTime ? `在${updateTime}` : "今天"}`
  parts.push(metrics.length ? `${prefix}${weatherText ? `大致是${weatherText}，` : ""}${metrics.join("，")}。` : `${prefix}${weatherText ? `大致是${weatherText}。` : "天气信息已更新。"} `)

  if (rainProb) {
    const rainNumber = Number(rainProb)
    if (Number.isFinite(rainNumber) && rainNumber >= 60) {
      parts.push(`今天降水概率较高，大约 ${rainProb}% ，建议带伞。`)
    } else if (Number.isFinite(rainNumber) && rainNumber >= 30) {
      parts.push(`今天有一定降水概率，大约 ${rainProb}% ，出门前可以留意一下降水变化。`)
    } else {
      parts.push(`今天降水概率不高，大约 ${rainProb}% 。`)
    }
  }

  if (temp) {
    const tempNumber = Number(temp)
    if (tempNumber <= 8) {
      parts.push("气温偏低，建议穿外套或稍厚一点的衣服。")
    } else if (tempNumber >= 28) {
      parts.push("体感可能偏热，注意补水和防晒。")
    } else {
      parts.push("整体体感相对适中，按日常出行穿着准备就行。")
    }
  }

  return parts.join("")
}

module.exports = async function weatherTool(input) {
  const resolved = await resolveLocation(input)
  if (!resolved || !resolved.adcode) {
    return {
      ok: false,
      answer:
        "小禾暂时还没法准确确定你想查哪个地方的天气。你可以直接说“兰州今天天气怎么样”，或者先开启定位，小禾就能查得更准一些。",
      cards: [],
      tips: "",
      guessQuestions: ["兰州今天天气怎么样？", "附近今天会下雨吗？", "今天适合穿什么衣服？"],
      followUp: ""
    }
  }

  if (!resolved.latitude || !resolved.longitude) {
    return {
      ok: false,
      answer: `小禾已经识别到${resolved.label || "目标地区"}，但还没拿到可用的天气坐标信息。你可以稍后再试，或者换个更具体的地区问我。`,
      cards: [],
      tips: "",
      guessQuestions: ["兰州今天天气怎么样？", "附近今天会下雨吗？", "今天适合穿什么衣服？"],
      followUp: ""
    }
  }

  const weatherData = await fetchOpenMeteoWeather(resolved.latitude, resolved.longitude)
  if (!weatherData) {
    return {
      ok: false,
      answer: `小禾已经定位到${resolved.label || "目标地区"}，但这会儿天气接口没有返回稳定结果。你可以稍后再试，或者直接换个地区问小禾。`,
      cards: [],
      tips: "",
      guessQuestions: ["附近今天会下雨吗？", "这周末适合出游吗？", "今天适合穿什么衣服？"],
      followUp: ""
    }
  }

  const locationLabel = buildDisplayLabel(resolved, resolved.explicitPlace)
  return {
    ok: true,
    answer: buildWeatherAnswer(locationLabel, weatherData),
    cards: [],
    tips: "天气属于实时信息，临出门前再看一眼会更稳妥。",
    guessQuestions: ["今天适合穿什么衣服？", `${locationLabel}这周末适合出游吗？`, `${locationLabel}附近有什么适合当天安排的活动？`],
    followUp: `如果你愿意，小禾也可以顺便帮你看看${locationLabel}附近有什么适合当前天气的活动或景点。`
  }
}
