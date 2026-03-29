const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  console.log('✅ createactivity running, openid=', OPENID)
  console.log('✅ event=', event)

  // 查用户角色
  const u = await db.collection('users').where({ _openid: OPENID }).limit(1).get()
  console.log('✅ users query:', u.data)

  if (u.data.length === 0) {
    return { success: false, message: '未找到用户记录' }
  }

  const role = u.data[0].role || 'user'
  console.log('✅ role=', role)

  if (role !== 'admin') {
    return { success: false, message: '无权限' }
  }

  const addRes = await db.collection('activities').add({
    data: {
      title: event.title,
      content: event.content,
      createdAt: db.serverDate()
    }
  })

  console.log('✅ inserted activity id=', addRes._id)
  return { success: true, id: addRes._id }
}
