Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let path = decodeURI(options.file)
    this.setData({
      path: path
    })

    let buffer = wx.getFileSystemManager().readFileSync(path);


    const that = this

    let url = 'https://6465-dev-1ant5-1300040403.tcb.qcloud.la/k0s5p5111909.JPG?sign=ea5b871e72de60711e24c803b50bec2f&t=1568985916'

    // 'https://6465-dev-1ant5-1300040403.tcb.qcloud.la/k0s3wwyc112y.jpeg?sign=7842665ac1246bc0a8581ea088c7629c&t=1568982949',

    console.log(buffer)

    wx.cloud.callFunction({
      name: 'crop',
      // 传给云函数的参数
      data: {
        // imgUrl: url,
        img: {
          contentType: 'image/jpg',
          value: buffer
        }
      },
      success: function (res) {
        console.log(res, '=========') // 3

        that.crop(res.result)
      },
      fail: console.error
    })
  },

  crop(result) {
    let size = result.imgSize

    if (result.results.length === 0) {
      return
    }


    let crop = result.results[0]

    let ctx = wx.createCanvasContext('canvas')

    let width = crop.cropRight - crop.cropLeft
    let height = crop.cropBottom - crop.cropTop

    ctx.drawImage(this.data.path, crop.cropLeft, crop.cropTop, width, height, 0, 0, 300, 300)
    ctx.draw()
  },

  onShareAppMessage: function() {

  }
})