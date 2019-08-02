var md5 = require('../vendor/md5.min.js')

const APP_KEY = 'du4pLaeOJiy9Osk0'
const APP_ID = '2119079343'

const HOST = 'https://api.ai.qq.com/fcgi-bin/ocr/'

// ocr_idcardocr  // 'card_type': '0', // 身份证图片类型，0-正面，1-反面
// ocr_driverlicenseocr
// ocr_generalocr
// ocr_bizlicenseocr
// ocr_creditcardocr
// ocr_bcocr

class Youtu {
  constructor() {}

  generalOcr(base64Image, params) {
    this.ocr(base64Image, params, 'ocr_generalocr')
  }

  idcardOcr(base64Image, params) {
    this.ocr(base64Image, params, 'ocr_idcardocr')
  }

  ocr(base64Image, params, ocrType) {
    let data = {
      'app_id': APP_ID,
      'image': base64Image,
      'time_stamp': Math.round(Date.now() / 1000),
      'nonce_str': Math.round(Math.random() * 100000000000000).toString(16),
      // 'sign': '',
    };

    data = Object.assign(data, params)
    data.sign = this.sign(data)

    // return

    wx.request({
      url: HOST + ocrType,
      method: 'POST',
      data,
      success(res) {
        console.log(res.data)
      },
      fail(err) {
        console.log(err)
      }
    })
  }


  sign(params) {
    let signStr = this.formatSignString(params)

    // console.log('sign ', signStr)

    return md5(signStr).toUpperCase();
  }

  formatSignString(params) {
    let strParam = "";
    let keys = Object.keys(params);
    keys.sort();
    for (let k in keys) {
      strParam += ("&" + keys[k] + "=" + params[keys[k]]);
    }

    strParam += 'app_key=' + APP_KEY;

    return strParam;
  }

}



export default Youtu