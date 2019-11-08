const wxUtil = require('../../utils/wxUtils.js')

const DeviceInfo = wx.getSystemInfoSync()
const DevicePixelRatio = DeviceInfo.pixelRatio

const ctx = wx.createCanvasContext('canvas')


Page({

  /**
   * Page initial data
   */
  data: {
    canvasId: 'canvas',
    card: {},
    canvasWidth: 210,
    canvasHeight: 297,
    // unit: 'px'
    showPopup: false,
    colors: ['#000000',
      '#ff2600',
      '#0433ff',
      '#00f900',
      '#fffb00',
      '#b2b2b2',
      '#ffffff',],

    waterprint: {
      text: '仅供 XXX 使用',
      color: 'black',
      size: 12,
      margin: 20,
      opacity: 30,
      rotation: -45,
    }
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(options) {
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('passParams', function(data) {
      that.setData({
        card: Object.assign({}, data || {})
      })

      that.drawWaterprint(that.data.waterprint)
    })
  },

  drawWaterprint(waterprint) {
    const that = this

    ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight)

    // 填充白色背景
    ctx.save()
    ctx.setFillStyle('white');
    ctx.fillRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);
    ctx.restore()


    this.drawImageInCanvas(that.data.card.frontImg, 20).then((res) => {
      if (that.data.card.backImg) {
        that.drawImageInCanvas(that.data.card.backImg, res.y + res.height + 20).then(res => {
          that.drawText(that.data.waterprint)
        })
      } else {
        that.drawText(that.data.waterprint)
      }
    })
  },

  drawImage(src, imageSize, rect) {
    ctx.save()

    ctx.drawImage(src, 0, 0, imageSize.width, imageSize.height, rect.x, rect.y, rect.width, rect.height)

    ctx.restore()
  },

  drawImageInCanvas(src, y) {
    const that = this

    return new Promise((resolve, rejct) => {
      this.getImageSize(src).then(res => {

        let rect = that.calcImageTargetRect(res, {
          width: that.data.canvasWidth,
          height: that.data.canvasHeight
        })
        // rect.x = x
        rect.y = y

        that.drawImage(src, res, rect)

        resolve(rect)
      })
    })
  },

  drawText({
    text,
    color,
    size,
    margin,
    opacity,
    rotation
  } = {
    color: 'red',
    size: 12,
    margin: 10,
    opacity: 0.5,
    rotation: 45,
  }) {
    if (!text) return 

    ctx.save()

    // ctx.font = size + 'px'
    ctx.setFontSize(size)
    ctx.setFillStyle(color)

    ctx.setGlobalAlpha(opacity / 100)


    // 按画布中心位置旋转
    ctx.translate(this.data.canvasWidth / 2, this.data.canvasHeight / 2)
    ctx.rotate(rotation * Math.PI / 180)

    // 再将画布原点重置为（0， 0）
    ctx.translate(-this.data.canvasWidth / 2, -this.data.canvasHeight / 2)

    const metrics = ctx.measureText(text)

    const textWidth = metrics.width
    const textHeight = size


    let col = Math.ceil(this.data.canvasWidth / (textWidth + margin) + 5)
    let row = Math.ceil(this.data.canvasHeight/ (textHeight + margin) + 5)
    let total = row * col

    let startX = - 2 * (textHeight + margin)
    let startY = - 2 * (textHeight + margin)

    for (let i = 0; i < total; i++) {
      let x = i % col * (textWidth + margin) + startX
      let y = Math.floor(i / col) * (textHeight + margin) + startY

      ctx.fillText(text, x, y)
    }

    ctx.draw()

    ctx.restore()
  },

  getImageSize(path) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: path,
        success(res) {

          resolve({
            width: res.width,
            height: res.height
          })
        }
      })
    })
  },

  calcImageTargetRect(imgSize, canvasSize) {
    let width = canvasSize.width / 1.5; // Math.min(canvasSize.width, imgSize.width)
    let height = imgSize.height / imgSize.width * width

    let x = (canvasSize.width - width ) / 2
    let y = 20

    return {
      x,
      y,
      width,
      height
    }
  },

  canvasToImage(success) {
    wx.canvasToTempFilePath({
      // x: 0,
      // y: 0,
      // width: this.data.appCodeRadius * 2,
      // height: this.data.appCodeRadius * 2,
      canvasId: this.data.canvasId,
      success: function (res) {
          success && success(res)
      }
    })
  },

  onTapSave() {
    const that = this
    that.canvasToImage(res => {
      wxUtil.saveImageToPhotosAlbum(res.tempFilePath).then(res => {
        wx.showToast({
          title: '保存成功',
        })
      }).catch(err => {

        if (err.errMsg.indexOf('cancel') >= 0 ) {
          return
        }

        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      })
    })
  },

  onTapShowWaterPrint() {
    this.setData({
      showPopup: true
    })
  },

  previewOnA4() {
    /* A4 paper: 210mm×297mm  Card: 85.6mm * 54mm */

    // resize canvas
    let width = DeviceInfo.screenWidth - 32
    let height = width * 297 / 210

    this.setData({
      canvasHeight: height,
      canvasWidth: width
    })


  },

  formSubmit() {

  },

  onTextChange(event) {
    if (this.data.waterprint.text === event.detail.value) {
      return
    }

    this.data.waterprint.text = event.detail.value

    this.drawWaterprint(this.data.waterprint)
  },

  onSizeChange(event) {
    this.data.waterprint.size = event.detail.value

    this.drawWaterprint(this.data.waterprint)
  },

  onMarginChange(event) {
    this.data.waterprint.margin = event.detail.value

    this.drawWaterprint(this.data.waterprint)
  },

  onOpacityChange(event) {
    this.data.waterprint.opacity = event.detail.value

    this.drawWaterprint(this.data.waterprint)
  },

  onRotationChange(event) {
    this.data.waterprint.rotation = event.detail.value

    this.drawWaterprint(this.data.waterprint)
  },

  onColorChange(event) {
    let color = event.currentTarget.dataset.item
    
    this.data.waterprint.color = color

    this.drawWaterprint(this.data.waterprint)
  }

})