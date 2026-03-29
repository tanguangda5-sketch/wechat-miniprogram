const https = require('https')
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const TENCENT_MAP_KEY = process.env.TENCENT_MAP_KEY || process.env.QQ_MAP_KEY || ''

async function getCurrentUserRecord() {
  const { OPENID } = cloud.getWXContext()
  const res = await db.collection('users').where({ openid: OPENID }).limit(1).get()

  if (!res.data.length) {
    return null
  }

  return res.data[0]
}

async function saveAndFetchUser(userId, data) {
  await db.collection('users').doc(userId).update({
    data: {
      ...data,
      updatedAt: db.serverDate(),
    },
  })

  const fresh = await db.collection('users').doc(userId).get()
  return fresh.data
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = ''
        res.on('data', (chunk) => {
          raw += chunk
        })
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw))
          } catch (error) {
            reject(error)
          }
        })
      })
      .on('error', reject)
  })
}

function normalizeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildDisplayName({ displayName, poiTitle, district, city, province, locationText }) {
  return (
    normalizeText(displayName) ||
    normalizeText(poiTitle) ||
    stripAdminPrefix(normalizeText(locationText)) ||
    normalizeText(district) ||
    normalizeText(city) ||
    normalizeText(province) ||
    normalizeText(locationText)
  )
}

function stripAdminPrefix(text) {
  const raw = normalizeText(text)
  if (!raw) return ''
  return raw.replace(/^(?:(?:[\u4e00-\u9fa5]{2,12})(?:省|特别行政区|自治州|地区|盟|市|区|县)){1,4}/u, '')
}

function scorePoi(item = {}) {
  const title = normalizeText(item.title || item.name)
  if (!title) {
    return -999
  }

  let score = 0
  if (/(大学|学院|校区|广场|商场|中心|公园|景区|小区|公寓|影城|影院|酒店|民宿|站)$/u.test(title)) score += 12
  if (/(人民政府|政府|居委会|村委会|街道办|派出所|卫生院)$/u.test(title)) score -= 8
  if (/(镇|村)$/u.test(title)) score += 4
  if (title.length <= 16) score += 3
  if (title.length >= 24) score -= 2

  const distance = normalizeNumber(item._distance || item.distance)
  if (distance !== null) {
    score += Math.max(0, 6 - distance / 200)
  }

  return score
}

function pickBestPoi(pois = []) {
  if (!Array.isArray(pois) || !pois.length) {
    return {}
  }

  return pois
    .map((item) => ({ item, score: scorePoi(item) }))
    .sort((a, b) => b.score - a.score)[0].item || {}
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key)
}

async function reverseGeocodeByTencentMap(location) {
  if (!TENCENT_MAP_KEY) {
    console.warn('[userManage] TENCENT_MAP_KEY missing, skip reverse geocode')
    return null
  }

  const latitude = normalizeNumber(location && location.latitude)
  const longitude = normalizeNumber(location && location.longitude)
  if (latitude === null || longitude === null) {
    return null
  }

  const url =
    'https://apis.map.qq.com/ws/geocoder/v1/?output=json&get_poi=1' +
    '&poi_options=policy=5;radius=1000;page_size=5;page_index=1' +
    `&location=${encodeURIComponent(`${latitude},${longitude}`)}` +
    `&key=${encodeURIComponent(TENCENT_MAP_KEY)}`

  const result = await requestJson(url)
  if (!result || result.status !== 0 || !result.result) {
    console.warn('[userManage] reverse geocode failed', result)
    return null
  }

  const addressComponent = result.result.address_component || {}
  const adInfo = result.result.ad_info || {}
  const pois = Array.isArray(result.result.pois) ? result.result.pois : []
  const nearestPoi = pickBestPoi(pois)
  const poiTitle =
    stripAdminPrefix(normalizeText(nearestPoi.title) || normalizeText(nearestPoi.name)) ||
    ''

  return {
    province: addressComponent.province || adInfo.province || '',
    city: addressComponent.city || adInfo.city || '',
    district: addressComponent.district || adInfo.district || '',
    adcode: adInfo.adcode || '',
    poiTitle,
    displayName:
      poiTitle ||
      addressComponent.street ||
      addressComponent.street_number ||
      '',
    locationText:
      result.result.address ||
      (result.result.formatted_addresses && result.result.formatted_addresses.recommend) ||
      '',
  }
}

async function placeSuggestionByTencentMap(keyword, options = {}) {
  if (!TENCENT_MAP_KEY) {
    console.warn('[userManage] TENCENT_MAP_KEY missing, skip place suggestion')
    return []
  }

  const text = normalizeText(keyword)
  if (!text) {
    return []
  }

  const params = [
    `keyword=${encodeURIComponent(text)}`,
    `key=${encodeURIComponent(TENCENT_MAP_KEY)}`,
    'output=json',
    'get_ad_info=1',
    'region_fix=0',
    'policy=1',
    'page_size=10',
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

  const url = `https://apis.map.qq.com/ws/place/v1/suggestion?${params.join('&')}`
  const result = await requestJson(url)
  if (!result || result.status !== 0 || !Array.isArray(result.data)) {
    console.warn('[userManage] place suggestion failed', result)
    return []
  }

  return result.data.map((item) => ({
    title: item.title || '',
    address: item.address || '',
    adcode: String(item.adcode || ''),
    province: item.province || '',
    city: item.city || '',
    district: item.district || '',
    latitude: item.location && item.location.lat,
    longitude: item.location && item.location.lng,
  }))
}

exports.main = async (event) => {
  try {
    const user = await getCurrentUserRecord()
    if (!user) {
      return {
        success: false,
        message: '用户不存在',
      }
    }

    if (event.action === 'updateProfile') {
      const profile = event.profile || {}
      const nextUser = await saveAndFetchUser(user._id, {
        avatarUrl: profile.avatarUrl || '',
        nickName: profile.nickName || '',
        gender: profile.gender || '未知',
        birthDate: profile.birthDate || '',
        profileCompleted: true,
      })

      return {
        success: true,
        userInfo: nextUser,
      }
    }

    if (event.action === 'updateOnboarding') {
      const payload = event.payload || {}
      let resolvedLocation = null

      try {
        resolvedLocation = payload.userLocation ? await reverseGeocodeByTencentMap(payload.userLocation) : null
      } catch (error) {
        console.error('[userManage] reverse geocode error', error)
        resolvedLocation = null
      }

      const nextUser = await saveAndFetchUser(user._id, {
        locationAuthorized: !!payload.locationAuthorized,
        locationChoiceMade: !!payload.locationChoiceMade,
        userLocation: payload.userLocation || null,
        province: (resolvedLocation && resolvedLocation.province) || user.province || '',
        city: (resolvedLocation && resolvedLocation.city) || user.city || '',
        district: (resolvedLocation && resolvedLocation.district) || user.district || '',
        adcode: (resolvedLocation && resolvedLocation.adcode) || user.adcode || '',
        locationText: (resolvedLocation && resolvedLocation.locationText) || user.locationText || '',
        displayName:
          (resolvedLocation && buildDisplayName(resolvedLocation)) ||
          user.displayName ||
          '',
      })

      return {
        success: true,
        userInfo: nextUser,
      }
    }

    if (event.action === 'updateRegion') {
      const payload = event.payload || {}
      let resolvedLocation = null

      try {
        resolvedLocation = payload.userLocation ? await reverseGeocodeByTencentMap(payload.userLocation) : null
      } catch (error) {
        console.error('[userManage] updateRegion reverse geocode error', error)
        resolvedLocation = null
      }

      const nextUser = await saveAndFetchUser(user._id, {
        locationAuthorized:
          typeof payload.locationAuthorized === 'boolean'
            ? payload.locationAuthorized
            : !!user.locationAuthorized,
        locationChoiceMade: true,
        userLocation: hasOwn(payload, 'userLocation')
          ? (payload.userLocation || null)
          : (user.userLocation || null),
        province:
          normalizeText(payload.province) ||
          (resolvedLocation && resolvedLocation.province) ||
          user.province ||
          '',
        city:
          normalizeText(payload.city) ||
          (resolvedLocation && resolvedLocation.city) ||
          user.city ||
          '',
        district:
          normalizeText(payload.district) ||
          (resolvedLocation && resolvedLocation.district) ||
          user.district ||
          '',
        adcode:
          normalizeText(payload.adcode) ||
          (resolvedLocation && resolvedLocation.adcode) ||
          user.adcode ||
          '',
        locationText:
          normalizeText(payload.locationText) ||
          (resolvedLocation && resolvedLocation.locationText) ||
          user.locationText ||
          '',
        displayName:
          buildDisplayName({
            displayName: payload.displayName,
            poiTitle: resolvedLocation && resolvedLocation.poiTitle,
            district:
              normalizeText(payload.district) ||
              (resolvedLocation && resolvedLocation.district) ||
              user.district ||
              '',
            city:
              normalizeText(payload.city) ||
              (resolvedLocation && resolvedLocation.city) ||
              user.city ||
              '',
            province:
              normalizeText(payload.province) ||
              (resolvedLocation && resolvedLocation.province) ||
              user.province ||
              '',
            locationText:
              normalizeText(payload.locationText) ||
              (resolvedLocation && resolvedLocation.locationText) ||
              user.locationText ||
              '',
          }) ||
          user.displayName ||
          '',
      })

      return {
        success: true,
        userInfo: nextUser,
      }
    }

    if (event.action === 'searchPlaceSuggestions') {
      const payload = event.payload || {}
      const list = await placeSuggestionByTencentMap(payload.keyword, {
        region: payload.region,
        latitude: payload.latitude,
        longitude: payload.longitude,
      })

      return {
        success: true,
        list,
      }
    }

    if (event.action === 'updateDNATags') {
      const tags = Array.isArray(event.tags) ? event.tags : []
      const nextUser = await saveAndFetchUser(user._id, {
        dnaTags: tags,
        dnaCompleted: true,
        onboardingCompleted: true,
      })

      return {
        success: true,
        userInfo: nextUser,
      }
    }

    return {
      success: false,
      message: '不支持的操作',
    }
  } catch (err) {
    console.error('userManage failed', err)
    return {
      success: false,
      message: '操作失败',
    }
  }
}
