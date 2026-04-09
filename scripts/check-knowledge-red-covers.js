const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const CLOUD_ENV = process.env.CLOUD_ENV || 'cloud1-3ghmr5ki7b1172fe'
const COLLECTION_NAME = 'knowledgeArticles'
const PAGE_SIZE = 100

function resolveWxServerSdk() {
  const manualPath = process.env.WX_SERVER_SDK_PATH
  const candidates = [
    manualPath,
    path.join(ROOT, 'node_modules', 'wx-server-sdk'),
    path.join(ROOT, 'cloudfunctions', 'getknowledgearticles', 'node_modules', 'wx-server-sdk'),
    path.join(ROOT, 'cloudfunctions', 'productOrder', 'node_modules', 'wx-server-sdk'),
    'wx-server-sdk',
  ].filter(Boolean)

  const tried = []
  for (const candidate of candidates) {
    try {
      const mod = require(candidate)
      return { cloud: mod, resolvedFrom: candidate }
    } catch (error) {
      tried.push(`${candidate}: ${error.message}`)
    }
  }

  const err = new Error(`Cannot find wx-server-sdk.\nTried:\n- ${tried.join('\n- ')}`)
  err.code = 'WX_SERVER_SDK_MISSING'
  throw err
}

function normalizeText(value = '') {
  return String(value || '').trim()
}

function isCoverNonEmpty(value) {
  return normalizeText(value) !== ''
}

function isCoverCloudId(value) {
  return /^cloud:\/\//i.test(normalizeText(value))
}

function isCoverEmpty(value) {
  return value == null || normalizeText(value) === ''
}

async function fetchRedArticles(db) {
  const list = []
  let offset = 0

  while (true) {
    const res = await db.collection(COLLECTION_NAME)
      .where({ channel: 'red' })
      .skip(offset)
      .limit(PAGE_SIZE)
      .get()

    const batch = Array.isArray(res.data) ? res.data : []
    list.push(...batch)

    if (batch.length < PAGE_SIZE) {
      break
    }

    offset += PAGE_SIZE
  }

  return list
}

function printArticle(article = {}, index = 0) {
  console.log(`--- article ${index + 1} ---`)
  console.log(`_id: ${normalizeText(article._id)}`)
  console.log(`seedKey: ${normalizeText(article.seedKey)}`)
  console.log(`title: ${normalizeText(article.title)}`)
  console.log(`status: ${normalizeText(article.status)}`)
  console.log(`channel: ${normalizeText(article.channel)}`)
  console.log(`cover: ${article.cover == null ? '' : String(article.cover)}`)
}

async function main() {
  const { cloud, resolvedFrom } = resolveWxServerSdk()
  cloud.init({ env: CLOUD_ENV })
  const db = cloud.database()

  const list = await fetchRedArticles(db)
  const total = list.length
  const coverNonEmptyCount = list.filter((item) => isCoverNonEmpty(item.cover)).length
  const coverCloudIdCount = list.filter((item) => isCoverCloudId(item.cover)).length
  const coverEmptyCount = list.filter((item) => isCoverEmpty(item.cover)).length

  console.log(`Using wx-server-sdk from: ${resolvedFrom}`)
  console.log(`collection=${COLLECTION_NAME} env=${CLOUD_ENV} channel=red`)
  console.log('=== summary ===')
  console.log(`total: ${total}`)
  console.log(`coverNonEmptyCount: ${coverNonEmptyCount}`)
  console.log(`coverCloudIdCount: ${coverCloudIdCount}`)
  console.log(`coverEmptyCount: ${coverEmptyCount}`)

  if (!list.length) {
    console.log('No red articles found.')
    return
  }

  console.log('=== articles ===')
  list.forEach((item, index) => printArticle(item, index))
}

main().catch((error) => {
  console.error('Fatal error:', error.message || error)
  process.exitCode = 1
})
