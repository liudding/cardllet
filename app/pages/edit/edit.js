import uniqueid from '../../utils/uid.js'
import {
  fileInfos,
  deepCopy
} from '../../utils/util.js'
import {
  formateCard
} from '../../utils/index.js'
import {
  ocr
} from '../../utils/cloud.js'

import {
  KEY_CARDS
} from '../../utils/constant.js'

import {
  removeFileIfExists,
  chooseImage,
  uploadFile
} from '../../utils/wxUtils.js'

import Locale from '../../utils/locale.js'



const db = wx.cloud.database()
const cardsCollection = db.collection('cards')

Page({

  data: {
    originCard: {},
    card: {},
    isFront: true,

    cardNumTitle: '卡号',
    saveButton: '保存'
  },

  onLoad: function(options) {
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('passParams', function(data) {
      that.data.originCard = data || {
        images: []
      }

      that.setData({
        card: deepCopy(that.data.originCard),
        cardNumTitle: Locale.t('cardNum'),
        saveButton: Locale.t('save')
      })

      wx.setNavigationBarTitle({
        title: (data && data._id) ? Locale.t('updateCard') : Locale.t('newCard'),
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
      itemList: [Locale.t('change'), Locale.t('delete')],
      success(res) {
        if (res.tapIndex === 0) {
          that.onTapChooseFront()
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: Locale.t('deletePicture'),
            content: Locale.t('deletePictureMessage'),
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
      itemList: [Locale.t('change'), Locale.t('delete')],
      success(res) {
        if (res.tapIndex === 0) {
          that.onTapChooseBack()
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: Locale.t('deletePicture'),
            content: Locale.t('deletePictureMessage'),
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
        title: Locale.t('warning'),
        content: Locale.t('cardPicRequired'),
        showCancel: false,
        success(res) {}
      })

      return
    }

    wx.showLoading({
      title: Locale.t('saving'),
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
          title: Locale.t('error'),
          content: Locale.t('failedToSaveCard'),
          showCancel: false,
        })
      }).finally(() => {
        wx.hideLoading()
      })
    }).catch(err => {
      console.log('ERROR: ', err)
      wx.hideLoading()
      wx.showModal({
        title: Locale.t('error'),
        content: Locale.t('failedToSavePic'),
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
        data: temp
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

  cardOcr(path) {
    ocr(path)
  }
})
