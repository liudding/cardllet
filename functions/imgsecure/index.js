const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  const {
    value
  } = event;
  try {
    const res = await cloud.openapi.security.imgSecCheck({
      media: {
        header: {
          'Content-Type': 'application/octet-stream'
        },
        contentType: 'image/png',
        value: Buffer.from(value)
      }
    })
    return res;
  } catch (err) {
    return err;
  }
}