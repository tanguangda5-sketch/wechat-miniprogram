const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { roleType, roleText } = event
  const { OPENID } = cloud.getWXContext()

  if (!roleType) return { ok: false, msg: 'roleType missing' }

  const users = db.collection('users')
  const now = new Date()

  const existed = await users.where({ _openid: OPENID }).get()

  if (existed.data.length > 0) {
    await users.doc(existed.data[0]._id).update({
      data: { roleType, roleText, updatedAt: now }
    })
  } else {
    await users.add({
      data: { _openid: OPENID, roleType, roleText, createdAt: now, updatedAt: now }
    })
  }
  return { ok: true }
}
