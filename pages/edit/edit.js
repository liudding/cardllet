import uniqueid from '../../utils/uid.js'
import {
  fileInfos,
  deepCopy
} from '../../utils/util.js'
import {
  formateCard
} from '../../utils/index.js'

import {
  KEY_CARDS
} from '../../utils/constant.js'
import Youtu from '../../utils/youtu.js'
import {
  removeFileIfExists,
  chooseImage,
  uploadFile
} from '../../utils/wxUtils.js'

const db = wx.cloud.database()
const cardsCollection = db.collection('cards')

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
      that.data.originCard = data || {
        images: []
      }

      that.setData({
        card: deepCopy(that.data.originCard)
      })
    })
  },

  updateUI() {
    let card = formateCard(this.data.card)

    this.setData({
      card: card
    })
  },


  onTapFlip() {
    this.setData({
      isFront: !this.data.isFront
    })
  },

  onTapChooseBack() {
    const that = this
    chooseImage().then(image => {
      that.data.card.images.splice(1, 1, image)

      that.updateUI()
    })
  },

  onTapChooseFront() {
    const that = this
    chooseImage().then(image => {
      that.data.card.images.splice(0, 1, image)

      that.updateUI()
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
                that.removeCardFace(0)
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
                that.removeCardFace(1)
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

    delete(temp.frontImg)
    delete(temp.backImg)


    if (temp.images.length < 1) {
      wx.showModal({
        title: '缺失卡片图片',
        content: '请添加卡片图片',
        showCancel: false,
        success(res) {}
      })

      return
    }

    wx.showLoading({
      title: '保存中',
    })

    const that = this
    let origin = this.data.originCard

    if (!temp.uid) {
      temp.uid = uniqueid()
    }

    // 为每张图片生成一个 uuid
    temp.images = temp.images.map(item => {
      if (!item.uid) {
        item.uid = uniqueid()
      }
      return item
    })

    let imagesToUpdate = temp.images.filter((item, index) => {

      let originImage = origin.images.find(o => o.uid === item.uid)

      if (!originImage || (originImage && originImage.path !== item.path)) {
        return true
      }
      return false
    }).concat([])

    let promises = imagesToUpdate.map((item, index) => {
      return that.saveImage(item.path)
    })

    Promise.all(promises).then(values => {

      for (let image of values) {
        let index = values.indexOf(image)

        let imageToUpdate = imagesToUpdate[index]

        let targetImage = temp.images.find(item => item.uid === imageToUpdate.uid)

        targetImage.path = image.cloudPath
        targetImage.localPath = image.savedFilePath
      }

      that.saveCard(temp).then(res => {
        // 保存成功
        temp._id = res._id

        that.saveToStorage(temp)

        const eventChannel = that.getOpenerEventChannel()
        eventChannel.emit('cardChanged', temp);
        wx.navigateBack()

      }).catch(err => {
        console.log('ERROR: ', err)
        wx.showModal({
          title: '出错了',
          content: '保存卡片失败',
          showCancel: false,
        })
      }).finally(() => {
        wx.hideLoading()
      })
    }).catch(err => {
      console.log('ERROR: ', err)
      wx.hideLoading()
      wx.showModal({
        title: '出错了',
        content: '保存图片失败',
        showCancel: false,
      })
    })
  },


  removeCardFace(index) {
    let card = this.data.card

    let item = card.images.splice(index, 1)

    removeFileIfExists(item.path)

    this.updateUI()
  },

  deleteOldImage(path, oldLocalPath) {
    wx.cloud.deleteFile({
      fileList: path,
      success: res => {
        removeFileIfExists(oldLocalPath)
      },
      fail: console.error
    })
  },

  deleteOldImages(images) {
    const that = this
    images.forEach(item => {
      that.deleteOldImage(item.path, item.localPath)
    })
  },

  /**
   * 保存文件到 cloud 并在本地缓存
   */
  saveImage(tempPath) {
    return new Promise((resolve, reject) => {
      if (!tempPath) {
        reject(null)
        return
      }

      let ext = fileInfos(tempPath).ext

      uploadFile(tempPath, uniqueid() + '.' + ext).then(res => {
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  },

  saveCard(card) {
    let temp = Object.assign({}, card)
    delete temp._id
    delete temp._openid

    if (card._id) { // 更新
      return cardsCollection.doc(card._id).update({
        data: temp
      })
    } else {
      return cardsCollection.add({
        data: card
      })
    }
  },


  saveToStorage(card) {
    let cards = wx.getStorageSync(KEY_CARDS) || []

    let index = cards.findIndex(item => item.uid === card.uid)

    if (index >= 0) {
      cards.splice(index, 1, card)
    } else {
      cards.push(card)
    }

    wx.setStorage({ key: KEY_CARDS, data: cards })
  },
})