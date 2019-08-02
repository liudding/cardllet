import uniqueid from '../../utils/uid.js'

import {
  KEY_CARDS
} from '../../utils/constant.js'
import Youtu from '../../utils/youtu.js'


Page({

  /**
   * Page initial data
   */
  data: {
    originCard: {},
    card: {},
    isFront: true
  },

  onLoad: function(options) {
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('passParams', function(data) {
      that.data.originCard = data || {}
      that.setData({
        card: Object.assign({}, data || {})
      })
    })
  },

  ocrCard(path) {
    let base64Image = wx.getFileSystemManager().readFileSync(path,'base64')
    let youtu = new Youtu()
    youtu.generalOcr(base64Image)
  },

  onTapFlip() {
    this.setData({
      isFront: !this.data.isFront
    })
  },

  onTapChooseBack() {
    const that = this
    this.chooseImage().then(path => {
      that.data.card.backImg = path
      that.setData({
        card: that.data.card
      })
    })
  },

  onTapChooseFront() {
    const that = this
    this.chooseImage().then(path => {
      that.data.card.frontImg = path

      that.setData({
        card: that.data.card
      })
    })
  },

  onLongTapFront() {
    const that = this

    if (!this.data.card.frontImg) {
      return
    }

    wx.showActionSheet({
      itemList: ['更换', '删除'],
      success(res) {
        if (res.tapIndex === 0) {
          that.onTapChooseFront()
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '删除图片',
            content: '删除后可再次添加',
            success(res) {
              if (res.confirm) {
                that.removeCardFace('front')
              }
            }
          })
        }
      }
    })
  },

  onLongTapBack() {
    const that = this

    if (!this.data.card.backImg) {
      return
    }

    wx.showActionSheet({
      itemList: ['更换', '删除'],
      success(res) {
        if (res.tapIndex === 0) {
          that.onTapChooseBack()
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '删除图片',
            content: '删除后可再次添加',
            success(res) {
              if (res.confirm) {
                that.removeCardFace('back')
              }
            }
          })
        }
      }
    })
  },

  onCardNumConfrim(event) {
    this.data.card.num = event.detail.value
  },

  onTapSave() {
    let temp = Object.assign({}, this.data.card)
    if (!temp.frontImg) {
      wx.showModal({
        title: '缺失卡片图片',
        content: '请添加卡片图片',
        showCancel: false,
        success(res) {}
      })

      return
    }
    const that = this
    let origin = this.data.originCard

    if (temp.uid) {

    } else {
      temp.uid = uniqueid()
    }

    Promise.all([
      this.saveImage(temp.frontImg, origin.frontImg),
      this.saveImage(temp.backImg, origin.backImg)
    ]).then(values => {
      temp.frontImg = values[0]
      temp.backImg = values[1]

      that.saveToStorage(temp)

      // 保存成功
      const eventChannel = that.getOpenerEventChannel()
      eventChannel.emit('cardChanged', temp);
      wx.navigateBack()
    })
  },

  chooseImage() {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 1,
        sizeType: 'compressed',
        success: function (res) {
          resolve(res.tempFilePaths[0])
        },
        fail(err) {
          reject(err)
        }
      })
    })
    
  },

  removeCardFace(face = 'front') {
    let card = this.data.card
    let path = null
    if (face === 'front') {
      path = card.frontImg
      card.frontImg = null
    } else if (face === 'back') {
      path = card.backImg
      card.backImg = null
    }
    this.removeFileIfExists(path)
    
    this.setData({
      card: card
    })
  },

  removeFileIfExists(path) {
    return new Promise((resolve, reject) => {
      wx.removeSavedFile({
        filePath: path,
        success() {
          resolve()
        },
        fail(err) {
          if (err.errMsg.indexOf('not exist') >= 0) {
            resolve()
            return
          }
          reject(err)
        },
        complete() {

        }
      })
    })
    
  },

  saveImage(tempPath, oldpath) {
    return new Promise((resolve, reject) => {
      if (tempPath === oldpath) {
        resolve(oldpath)
        return
      }

      if (oldpath) { // 先删除旧文件
        this.removeFileIfExists(oldpath)
      }

      if (!tempPath) {
        resolve(null)
        return
      }

      wx.saveFile({
        tempFilePath: tempPath,
        success(res) {
          resolve(res.savedFilePath)
        },
        fail(err) {
          reject(err)
        }
      })
    })
  },

  saveToStorage(card) {
    let cards = wx.getStorageSync(KEY_CARDS) || []

    let index = cards.findIndex(item => item.uid === card.uid)

    if (index >= 0) {
      cards.splice(index, 1, card)
    } else {
      cards.push(card)
    }

    wx.setStorageSync(KEY_CARDS, cards)
  },
})