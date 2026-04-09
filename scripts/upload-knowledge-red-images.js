const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const MANIFEST_PATH = path.join(ROOT, 'scripts', 'data', 'knowledge_red_image_manifest.json')
const CLOUD_ENV = process.env.CLOUD_ENV || 'cloud1-3ghmr5ki7b1172fe'
const DRY_RUN = process.env.DRY_RUN !== 'false'
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

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8')
  const list = JSON.parse(raw)
  if (!Array.isArray(list)) {
    throw new Error('knowledge_red_image_manifest.json must export an array')
  }
  return list
}

function normalizeText(value = '') {
  return String(value || '').trim()
}

function shouldUpload(item = {}) {
  return item.verifiedRealPhoto === true && item.aiGenerated === false && item.resolutionStatus !== 'unresolved'
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

async function findArticle(db, seedKey) {
  const res = await db.collection(COLLECTION_NAME).where({ seedKey }).limit(2).get()
  const docs = res.data || []
  if (docs.length > 1) {
    throw new Error(`duplicate seedKey documents: ${seedKey}`)
  }
  return docs[0] || null
}

function buildUploadedAsset(item, fileID) {
  return {
    role: normalizeText(item.coverRole),
    cloudPath: normalizeText(item.cloudPath),
    fileID: normalizeText(fileID),
    sourcePageUrl: normalizeText(item.sourcePageUrl),
    originalImageUrl: normalizeText(item.originalImageUrl),
    photographer: normalizeText(item.photographer),
    license: normalizeText(item.license),
    attribution: normalizeText(item.attribution),
    licenseUrl: normalizeText(item.licenseUrl),
    uploadedAt: new Date(),
  }
}

async function uploadOne(cloud, db, item, stats) {
  const localPath = path.join(ROOT, normalizeText(item.localFile))
  if (!shouldUpload(item)) {
    stats.skipped += 1
    console.log(`[skipped] seedKey=${item.seedKey} role=${item.coverRole} reason=unresolved_or_unverified`)
    return
  }

  if (!fs.existsSync(localPath)) {
    stats.missingLocal += 1
    console.log(`[missing-local] seedKey=${item.seedKey} role=${item.coverRole} file=${localPath}`)
    return
  }

  if (DRY_RUN) {
    stats.planned += 1
    console.log(`[dry-run:upload] seedKey=${item.seedKey} role=${item.coverRole} local=${localPath} cloudPath=${item.cloudPath}`)
    return
  }

  const uploadRes = await cloud.uploadFile({
    cloudPath: normalizeText(item.cloudPath),
    fileContent: fs.readFileSync(localPath),
  })

  const article = await findArticle(db, normalizeText(item.seedKey))
  if (!article) {
    stats.orphanUploads += 1
    console.log(`[uploaded-no-doc] seedKey=${item.seedKey} role=${item.coverRole} fileID=${uploadRes.fileID}`)
    return
  }

  const currentMeta = article.imageMeta && typeof article.imageMeta === 'object' ? article.imageMeta : {}
  const currentAssets = Array.isArray(currentMeta.uploadedAssets) ? currentMeta.uploadedAssets : []
  const nextAssets = currentAssets.filter((asset = {}) => normalizeText(asset.cloudPath) !== normalizeText(item.cloudPath))
  nextAssets.push(buildUploadedAsset(item, uploadRes.fileID))

  const nextImageMeta = {
    ...currentMeta,
    resolutionStatus: currentMeta.resolutionStatus === 'unresolved' ? 'partially_uploaded' : 'uploaded',
    uploadedAssets: nextAssets,
    lastUploadAt: new Date(),
  }

  const updateData = {
    imageMeta: nextImageMeta,
    updatedAt: new Date(),
  }

  if (normalizeText(item.coverRole) === 'cover') {
    updateData.cover = uploadRes.fileID
  }

  await db.collection(COLLECTION_NAME).doc(article._id).update({
    data: updateData,
  })

  stats.uploaded += 1
  console.log(`[uploaded] seedKey=${item.seedKey} role=${item.coverRole} fileID=${uploadRes.fileID}`)
}

async function main() {
  const manifest = loadManifest()
  const { cloud, resolvedFrom } = resolveWxServerSdk()
  cloud.init({ env: CLOUD_ENV })
  const db = cloud.database()

  const stats = {
    total: manifest.length,
    planned: 0,
    uploaded: 0,
    skipped: 0,
    missingLocal: 0,
    orphanUploads: 0,
  }

  console.log(`Using wx-server-sdk from: ${resolvedFrom}`)
  console.log(`collection=${COLLECTION_NAME} env=${CLOUD_ENV} dryRun=${DRY_RUN}`)

  if (!DRY_RUN) {
    await assertDatabaseReady(db)
  }

  for (const item of manifest) {
    try {
      await uploadOne(cloud, db, item, stats)
    } catch (error) {
      stats.orphanUploads += 1
      console.log(`[error] seedKey=${item && item.seedKey ? item.seedKey : 'UNKNOWN'} role=${item && item.coverRole ? item.coverRole : 'unknown'} message=${error.message}`)
    }
  }

  console.log('--- summary ---')
  console.log(JSON.stringify(stats, null, 2))
}

main().catch((error) => {
  console.error('Fatal error:', error.message || error)
  process.exitCode = 1
})