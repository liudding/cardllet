// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

/**
 * 多次尝试，总是报错：media data missing
 */

// 云函数入口函数
exports.main = async(event, context) => {

  let params = {
    type: event.type || 'photo'
  }

  if (event.imgUrl) {
    params.imgUrl = event.imgUrl
  } else {
    let buffer
    if (event.isBase64) {
      buffer = Buffer.from(event.img.value, 'base64')

    } else {
      buffer = Buffer.from(event.img.value)
    }

    params.img = {
      header: {'Content-Type': 'application/octet-stream'},
      contentType: 'image/png',
      value: buffer
    }

    params.media = {
      header: { 'Content-Type': 'application/octet-stream' },
      contentType: 'image/png',
      value: buffer
    }

  }

  console.log(params, '+++++++')


  let r = await cloud.openapi.ocr.bankcard(params)

  return r
}