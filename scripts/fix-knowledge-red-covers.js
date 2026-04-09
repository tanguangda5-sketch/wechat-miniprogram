const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const CLOUD_ENV = process.env.CLOUD_ENV || 'cloud1-3ghmr5ki7b1172fe'
const DRY_RUN = process.env.DRY_RUN !== 'false'
const COLLECTION_NAME = 'knowledgeArticles'
const COVER_MAP = {
  'red-gansu-gaotai-martyrs-cemetery': 'cloud://cloud1-3ghmr5ki7b1172fe.636c-cloud1-3ghmr5ki7b1172fe-1403917845/knowledge/covers/red-gansu-gaotai-martyrs-cemetery.jpg',
  'red-gansu-hadapu-long-march': 'cloud://cloud1-3ghmr5ki7b1172fe.636c-cloud1-3ghmr5ki7b1172fe-1403917845/knowledge/covers/red-gansu-hadapu-long-march.jpg',
  'red-gansu-huining-meeting-site': 'cloud://cloud1-3ghmr5ki7b1172fe.636c-cloud1-3ghmr5ki7b1172fe-1403917845/knowledge/covers/red-gansu-huining-meeting-site.jpg',
  'red-gansu-lazikou-battle-site': 'cloud://cloud1-3ghmr5ki7b1172fe.636c-cloud1-3ghmr5ki7b1172fe-1403917845/knowledge/covers/red-gansu-lazikou-battle-site.jpg',
  'red-gansu-nanliang-revolution-memorial': 'cloud://cloud1-3ghmr5ki7b1172fe.636c-cloud1-3ghmr5ki7b1172fe-1403917845/knowledge/covers/red-gansu-nanliang-revolution-memorial.jp.jpg',
  'red-gansu-red-route': 'cloud://cloud1-3ghmr5ki7b1172fe.636c-cloud1-3ghmr5ki7b1172fe-1403917845/knowledge/covers/red-gansu-red-route.jpg',
}

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

async function fixOne(db, seedKey, cover, stats) {
  const res = await db.collection(COLLECTION_NAME)
    .where({
      seedKey,
      channel: 'red',
    })
    .limit(2)
    .get()

  const docs = res.data || []
  if (docs.length === 0) {
    stats.error += 1
    console.log(`[error] seedKey=${seedKey} reason=not_found`)
    return
  }

  if (docs.length > 1) {
    stats.error += 1
    console.log(`[error] seedKey=${seedKey} reason=duplicate_documents count=${docs.length}`)
    return
  }

  const doc = docs[0]
  const currentCover = normalizeText(doc.cover)
  if (currentCover === cover) {
    console.log(`[no-change] seedKey=${seedKey} _id=${doc._id} cover=${cover}`)
    return
  }

  if (DRY_RUN) {
    stats.updated += 1
    console.log(`[dry-run:update] seedKey=${seedKey} _id=${doc._id} from=${currentCover || '(empty)'} to=${cover}`)
    return
  }

  await db.collection(COLLECTION_NAME).doc(doc._id).update({
    data: {
      cover,
      updatedAt: new Date(),
    },
  })
  stats.updated += 1
  console.log(`[updated] seedKey=${seedKey} _id=${doc._id} from=${currentCover || '(empty)'} to=${cover}`)
}

async function main() {
  const { cloud, resolvedFrom } = resolveWxServerSdk()
  cloud.init({
    env: CLOUD_ENV,
  })
  const db = cloud.database()

  const stats = {
    total: Object.keys(COVER_MAP).length,
    updated: 0,
    error: 0,
  }

  console.log(`Using wx-server-sdk from: ${resolvedFrom}`)
  console.log(`collection=${COLLECTION_NAME} env=${CLOUD_ENV} dryRun=${DRY_RUN}`)

  for (const [seedKey, cover] of Object.entries(COVER_MAP)) {
    try {
      await fixOne(db, seedKey, cover, stats)
    } catch (error) {
      stats.error += 1
      console.log(`[error] seedKey=${seedKey} message=${error.message}`)
    }
  }

  console.log('--- summary ---')
  console.log(`total=${stats.total}`)
  console.log(`updated=${stats.updated}`)
  console.log(`error=${stats.error}`)
}

main().catch((error) => {
  console.error('Fatal error:', error.message || error)
  process.exitCode = 1
})
