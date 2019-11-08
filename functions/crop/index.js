// 云函数入口文件
const cloud = require('wx-server-sdk')

// cloud.init()
cloud.init({
  // env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()

  wx.base64ToArrayBuffer('ssd')

  console.log('[image data]: ', event.img)

  let r = await cloud.openapi.img.aiCrop({
    // imgUrl: event.imgUrl,
    img: event.img
  })

  return r

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}