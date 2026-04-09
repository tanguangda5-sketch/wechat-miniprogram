const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PAYLOAD_PATH = path.join(ROOT, 'scripts', 'data', 'knowledge_red_articles_payload.json')
const CLOUD_ENV = process.env.CLOUD_ENV || 'cloud1-3ghmr5ki7b1172fe'
const DRY_RUN = process.env.DRY_RUN !== 'false'
const SECRET_ID =
  process.env.TENCENT_SECRET_ID ||
  process.env.TENCENTCLOUD_SECRET_ID ||
  process.env.SecretId ||
  ''

const SECRET_KEY =
  process.env.TENCENT_SECRET_KEY ||
  process.env.TENCENTCLOUD_SECRET_KEY ||
  process.env.SecretKey ||
  ''
const COLLECTION_NAME = 'knowledgeArticles'

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

function loadPayload() {
  const raw = fs.readFileSync(PAYLOAD_PATH, 'utf8')
  const list = JSON.parse(raw)
  if (!Array.isArray(list)) {
    throw new Error('knowledge_red_articles_payload.json must export an array')
  }
  return list
}

function normalizeText(value = '') {
  return String(value || '').trim()
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function parseDate(value, fallback = new Date()) {
  if (!value) {
    return fallback
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function normalizeLocation(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  return {
    name: normalizeText(value.name),
    address: normalizeText(value.address),
    latitude: Number(value.latitude) || 0,
    longitude: Number(value.longitude) || 0,
  }
}

function normalizeContent(value) {
  return normalizeArray(value).map((item = {}) => ({
    type: normalizeText(item.type) || 'paragraph',
    text: normalizeText(item.text),
    src: normalizeText(item.src),
  }))
}

function buildArticle(item = {}) {
  const seedKey = normalizeText(item.seedKey)
  if (!seedKey) {
    throw new Error('seedKey is required')
  }

  const location = normalizeLocation(item.location)
  const article = {
    seedKey,
    slug: normalizeText(item.slug),
    channel: 'red',
    title: normalizeText(item.title),
    publishTime: normalizeText(item.publishTime),
    tags: normalizeArray(item.tags).map((tag) => normalizeText(tag)).filter(Boolean),
    wordCount: Number(item.wordCount) || 0,
    summary: normalizeText(item.summary),
    cover: normalizeText(item.cover),
    views: Number(item.views) || 0,
    likes: Number(item.likes) || 0,
    favorites: Number(item.favorites) || 0,
    comments: Number(item.comments) || 0,
    shareCount: Number(item.shareCount) || 0,
    author: normalizeText(item.author) || 'knowledge-red-editor',
    location: location && location.name ? location : null,
    content: normalizeContent(item.content),
    status: 'published',
    updatedAt: parseDate(item.updatedAt),
    isPinned: Boolean(item.isPinned),
    commentList: normalizeArray(item.commentList),
    imageMeta: item.imageMeta && typeof item.imageMeta === 'object' ? item.imageMeta : null,
  }

  if (!article.title) {
    throw new Error(`title is required for seedKey=${seedKey}`)
  }

  return article
}

function buildInsertData(article) {
  return {
    ...article,
    createdAt: parseDate(article.publishTime),
  }
}

function buildUpdateData(article) {
  return { ...article }
}

async function assertDatabaseReady(db) {
  try {
    await db.collection(COLLECTION_NAME).limit(1).get()
  } catch (error) {
    const message = String((error && error.message) || error || '')
    if (message.includes('missing secretId or secretKey')) {
      throw new Error('wx-server-sdk is missing secretId/secretKey; run this script in an environment with valid cloud credentials')
    }
    throw error
  }
}

async function upsertOne(db, item, stats) {
  const article = buildArticle(item)
  const res = await db.collection(COLLECTION_NAME).where({ seedKey: article.seedKey }).limit(2).get()
  const docs = res.data || []

  if (docs.length > 1) {
    stats.error += 1
    console.log(`[error] seedKey=${article.seedKey} reason=duplicate_documents count=${docs.length}`)
    return
  }

  if (docs.length === 0) {
    if (DRY_RUN) {
      stats.created += 1
      console.log(`[dry-run:create] seedKey=${article.seedKey} title=${article.title}`)
      return
    }

    await db.collection(COLLECTION_NAME).add({
      data: buildInsertData(article),
    })
    stats.created += 1
    console.log(`[created] seedKey=${article.seedKey} title=${article.title}`)
    return
  }

  const doc = docs[0]
  if (DRY_RUN) {
    stats.updated += 1
    console.log(`[dry-run:update] seedKey=${article.seedKey} _id=${doc._id} title=${article.title}`)
    return
  }

  await db.collection(COLLECTION_NAME).doc(doc._id).update({
    data: buildUpdateData(article),
  })
  stats.updated += 1
  console.log(`[updated] seedKey=${article.seedKey} _id=${doc._id} title=${article.title}`)
}

async function main() {
  const payload = loadPayload()
  const { cloud, resolvedFrom } = resolveWxServerSdk()
  cloud.init({
    env: CLOUD_ENV,
    secretId: SECRET_ID || undefined,
    secretKey: SECRET_KEY || undefined,
  })
  const db = cloud.database()

  const stats = {
    total: payload.length,
    created: 0,
    updated: 0,
    error: 0,
  }

  console.log(`Using wx-server-sdk from: ${resolvedFrom}`)
  console.log(`collection=${COLLECTION_NAME} env=${CLOUD_ENV} dryRun=${DRY_RUN}`)

  await assertDatabaseReady(db)

  for (const item of payload) {
    try {
      await upsertOne(db, item, stats)
    } catch (error) {
      stats.error += 1
      console.log(`[error] seedKey=${item && item.seedKey ? item.seedKey : 'UNKNOWN'} message=${error.message}`)
    }
  }

  console.log('--- summary ---')
  console.log(JSON.stringify(stats, null, 2))
}

main().catch((error) => {
  console.error('Fatal error:', error.message || error)
  process.exitCode = 1
})