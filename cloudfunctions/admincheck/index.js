const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const res = await db.collection('users').where({
    _openid: OPENID
  }).limit(1).get()

  // 没有用户记录：当作普通用户
  if (res.data.length === 0) {
    return { isAdmin: false, role: 'user' }
  }

  const user = res.data[0]
  const role = user.role || 'user'
  const isAdmin = role === 'admin'

  return { isAdmin, role }
}
