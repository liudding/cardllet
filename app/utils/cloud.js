function ocr(path) {
  // imgSecure(path)
  // return
  wx.getFileSystemManager().readFile({
    filePath: path,
    success: buffer => {
      console.log(buffer.data)
      wx.cloud.callFunction({
        name: 'ocr',
        data: {
          img: { 
            contentType: 'image/png',
            value: buffer.data
          }
        }
      }).then(
        imgRes => {
          console.log('OCR res: ', imgRes)
        })

    },
    fail: err => {
      console.log(err)
    }
  })

  return

  wx.getImageInfo({
    src: path,
    success(res) {
      console.log('OCR: ', res)

      let buffer = wx.getFileSystemManager().readFileSync(path);

      console.log(buffer)

      wx.cloud.callFunction({
        name: 'ocr',
        // 传给云函数的参数
        data: {
          // imgUrl: url,
          img: {
            contentType: 'image/' + res.type,
            value: buffer
          },
          isBase64: true
        },
        success: function(res) {
          console.log(res, '=========') // 3
        },
        fail: console.error
      })
    }
  })


}

function imgSecure(path) {
  wx.getFileSystemManager().readFile({
    filePath: path,
    success: buffer => {
      console.log(buffer.data)
      wx.cloud.callFunction({
        name: 'imgsecure',
        data: {
          value: buffer.data
        }
      }).then(
        imgRes => {
          console.log(imgRes)
          if (imgRes.result.errorCode == '87014') {
            wx.showToast({
              title: '图片含有违法违规内容',
            })
            return
          } else {
            //图片正常
          }
        })

    },
    fail: err => {
      console.log(err)
    }
  })
}

module.exports = {
  ocr
}