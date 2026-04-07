const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function normalizeText(value = '') {
  return String(value || '').trim()
}

async function ensureUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  const user = res.data[0] || null
  if (!user) {
    const error = new Error('WECHAT_LOGIN_REQUIRED')
    error.code = 'WECHAT_LOGIN_REQUIRED'
    throw error
  }

  if (!normalizeText(user.role)) {
    await db.collection('users').doc(user._id).update({
      data: {
        role: 'user',
        updatedAt: db.serverDate(),
      },
    })
  }

  return user
}

function validateAddress(payload = {}) {
  const receiverName = normalizeText(payload.receiverName)
  const receiverPhone = normalizeText(payload.receiverPhone).replace(/\s+/g, '')
  const province = normalizeText(payload.province)
  const city = normalizeText(payload.city)
  const district = normalizeText(payload.district)
  const detailAddress = normalizeText(payload.detailAddress)

  if (!receiverName) {
    throw Object.assign(new Error('RECEIVER_NAME_REQUIRED'), { code: 'RECEIVER_NAME_REQUIRED' })
  }
  if (!/^1[3-9]\d{9}$/.test(receiverPhone)) {
    throw Object.assign(new Error('INVALID_RECEIVER_PHONE'), { code: 'INVALID_RECEIVER_PHONE' })
  }
  if (!province || !city || !district || !detailAddress) {
    throw Object.assign(new Error('ADDRESS_REQUIRED'), { code: 'ADDRESS_REQUIRED' })
  }

  return {
    receiverName,
    receiverPhone,
    province,
    city,
    district,
    detailAddress,
    postalCode: normalizeText(payload.postalCode),
    isDefault: !!payload.isDefault,
  }
}

async function getOwnedAddress(id, openid) {
  const addressId = normalizeText(id)
  if (!addressId) {
    throw Object.assign(new Error('ADDRESS_NOT_FOUND'), { code: 'ADDRESS_NOT_FOUND' })
  }

  const res = await db.collection('addresses').doc(addressId).get()
  const address = res.data || null
  if (!address || normalizeText(address.ownerOpenid) !== openid) {
    throw Object.assign(new Error('ADDRESS_NOT_FOUND'), { code: 'ADDRESS_NOT_FOUND' })
  }
  return address
}

async function resetDefaultAddress(openid, ignoreId = '') {
  const list = await db.collection('addresses').where({
    ownerOpenid: openid,
    isDefault: true,
  }).get()

  for (const item of (list.data || [])) {
    if (item._id === ignoreId) continue
    await db.collection('addresses').doc(item._id).update({
      data: {
        isDefault: false,
        updatedAt: db.serverDate(),
      },
    })
  }
}

async function listAddresses(openid) {
  await ensureUser(openid)
  const res = await db.collection('addresses')
    .where({ ownerOpenid: openid })
    .orderBy('isDefault', 'desc')
    .orderBy('updatedAt', 'desc')
    .get()

  return {
    success: true,
    data: {
      list: res.data || [],
    },
  }
}

async function detailAddress(event, openid) {
  await ensureUser(openid)
  const address = await getOwnedAddress(event.id, openid)
  return {
    success: true,
    data: {
      address,
    },
  }
}

async function createAddress(event, openid) {
  await ensureUser(openid)
  const payload = validateAddress(event)

  const countRes = await db.collection('addresses').where({ ownerOpenid: openid }).count()
  const shouldDefault = payload.isDefault || countRes.total === 0
  if (shouldDefault) {
    await resetDefaultAddress(openid)
  }

  const addRes = await db.collection('addresses').add({
    data: {
      ownerOpenid: openid,
      ...payload,
      isDefault: shouldDefault,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    },
  })
  const fresh = await db.collection('addresses').doc(addRes._id).get()

  return {
    success: true,
    data: {
      address: fresh.data,
    },
  }
}

async function updateAddress(event, openid) {
  await ensureUser(openid)
  const address = await getOwnedAddress(event.id, openid)
  const payload = validateAddress(event)
  const shouldDefault = payload.isDefault || !!address.isDefault

  if (shouldDefault) {
    await resetDefaultAddress(openid, address._id)
  }

  await db.collection('addresses').doc(address._id).update({
    data: {
      ...payload,
      isDefault: shouldDefault,
      updatedAt: db.serverDate(),
    },
  })

  const fresh = await db.collection('addresses').doc(address._id).get()
  return {
    success: true,
    data: {
      address: fresh.data,
    },
  }
}

async function deleteAddress(event, openid) {
  await ensureUser(openid)
  const address = await getOwnedAddress(event.id, openid)
  await db.collection('addresses').doc(address._id).remove()

  if (address.isDefault) {
    const next = await db.collection('addresses')
      .where({ ownerOpenid: openid })
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get()
    const target = (next.data || [])[0]
    if (target) {
      await db.collection('addresses').doc(target._id).update({
        data: {
          isDefault: true,
          updatedAt: db.serverDate(),
        },
      })
    }
  }

  return {
    success: true,
    data: {
      deleted: true,
    },
  }
}

async function setDefault(event, openid) {
  await ensureUser(openid)
  const address = await getOwnedAddress(event.id, openid)
  await resetDefaultAddress(openid, address._id)
  await db.collection('addresses').doc(address._id).update({
    data: {
      isDefault: true,
      updatedAt: db.serverDate(),
    },
  })
  const fresh = await db.collection('addresses').doc(address._id).get()

  return {
    success: true,
    data: {
      address: fresh.data,
    },
  }
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext()
  const action = normalizeText(event.action)

  try {
    if (action === 'list') return await listAddresses(OPENID)
    if (action === 'detail') return await detailAddress(event, OPENID)
    if (action === 'create') return await createAddress(event, OPENID)
    if (action === 'update') return await updateAddress(event, OPENID)
    if (action === 'delete') return await deleteAddress(event, OPENID)
    if (action === 'setDefault') return await setDefault(event, OPENID)

    return {
      success: false,
      message: 'UNSUPPORTED_ACTION',
    }
  } catch (error) {
    console.error('[addressManage] failed', action, error)
    return {
      success: false,
      message: error.code || error.message || 'ADDRESS_MANAGE_FAILED',
    }
  }
}
