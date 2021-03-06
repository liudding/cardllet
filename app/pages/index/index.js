//index.js
//获取应用实例
const app = getApp()

import {
  KEY_CARDS, KEY_LAUNCH_TIMES, KEY_DEMO_CARDS
} from '../../utils/constant.js'

import { syncCards, formateCard, deleteCard, removeDemoCard } from '../../utils/index.js'

import {
  saveImageToPhotosAlbum,
  removeFileIfExists,
  getFileList
} from '../../utils/wxUtils.js'

import Locale from '../../utils/locale.js'

const db = wx.cloud.database()
const cardsCollection = db.collection('cards')


Page({
  data: {
    cards: [],
    openIndex: null, // 本次（刚刚）打开的 index
    selectedCard: null,
    menu: [{
        title: '保存图片',
        pic: '../../images/download.png'
      },
      {
        title: '编辑',
        pic: '../../images/edit.png'
      },
      {
        title: '删除',
        pic: '../../images/delete.png'
      },

    ],
    openGooeyMenu: false,
    isFront: true
  },

  onLoad: function () {

    wx.setNavigationBarTitle({
      title: Locale.t('homeTitle'),
    })

    let cards = wx.getStorageSync(KEY_CARDS) || []

    // 可能是小程序的bug，getStorage 会报错
    let demoCards = wx.getStorageSync(KEY_DEMO_CARDS) || []

    cards = cards.concat(demoCards).filter(item => item)

    if (cards.length > 0) {
      this.updateUI(cards)
    }

    const that = this

    wx.showLoading({
      title: Locale.t('loading'),
    })

    syncCards({
      progress: (card, cards, newCached) => {
        if (newCached) {
          that.updateUI(cards)
        }
      }, 
      complete:(cards) => {
        console.log('cards sync completed: ', cards.length)

        if (cards.length > 0) {
          that.updateUI(cards)
        } else {
          this.updateUI(demoCards)
        }
        
        wx.hideLoading()
      },
      fail(err) {
        console.log(err)
        wx.hideLoading()
      }
    })


    this.handleFavorite()
  },

  handleFavorite() {
    if (app.globalData.isFirstTime) {
      this.setData({
        showFavorite: true
      })
    }

    setTimeout(() => {
      this.setData({
        showFavorite: false
      })
    }, 5000)
  },

  updateUI(cards) {
    console.log('updateUI: ', cards.length)

    let formated = cards.map(item => {
      return formateCard(item)
    })

    let selectedCard = this.data.selectedCard ? formateCard(this.data.selectedCard) : null

    this.setData({
      cards: formated,
      selectedCard: selectedCard
    })
  },

  

  onTapCard(event) {
    let index = event.currentTarget.dataset.index
    let card = event.currentTarget.dataset.item

    // 当已经选中了一张卡片之后，点击其他卡片，则不响应
    // 由于隐藏其他卡片使用的是 opacity，隐藏掉的卡片仍然会占用空间，也会触发此事件。所以使用这各 trick 来解决
    if (this.data.selectedCard) {
      if (this.data.selectedCard.uid !== card.uid) { // 点击了其他卡片
        return
      } else { // 再次点击了已经打开的卡片
        this.resetToStack()
        return
      }
      return
    }

    setTimeout(() => {
      this.setData({
        openGooeyMenu: true
      })
    }, 200)

    this.setData({
      openIndex: index,
      selectedCard: card
    })
  },

  resetToStack() {
    this.setData({
      openGooeyMenu: false,
      isFront: true
    })

    const that = this
    setTimeout(() => {
      that.setData({
        selectedCard: null,
      })
    }, 100)

  },



  onTapFlip() {
    this.setData({
      isFront: !this.data.isFront
    })
  },

  onTapAdd() {
    this.gotoEdit()
  },

  onTapMenuItem(event) {
    const item = event.detail.item
    const index = event.detail.index

    let card = this.data.selectedCard

    const that = this

    if (index === 0) { // 保存图片
      wx.showActionSheet({
        itemList: [Locale.t('saveToAlbum'), Locale.t('addWatermark')],
        success(res) {
          if (res.tapIndex === 0) {
            that.saveToPhotosAlbum(card)
          } else {
            that.gotoWaterPrint(card)
          }
        },
      })
      return 
    } 

     if (index === 1) { // 编辑
      if (card.isDemo) {
        wx.showModal({
          title: '提示',
          content: '示例卡片不能编辑',
          showCancel: false
        })

        return
      }

      this.gotoEdit(card)
    } else if (index === 2) { // 删除
      wx.showModal({
        title: Locale.t('removeCardTitle'),
        content: Locale.t('removeCardMessage'),
        confirmColor: '#FF6C6C',
        confirmText: Locale.t('remove'),
        success(res) {
          if (!res.confirm) {
            return
          }

          that.removeCard(card)
        }
      })

    }
  },

  onTapMenu() {
    this.resetToStack()
  },

  onTapCopy() {
    wx.setClipboardData({
      data: this.data.selectedCard.num,
      success(res) {
        wx.showToast({
          title: Locale.t('copySuccess'),
          icon: 'none'
        })
      }
    })
  },

  onCardChanged(card) {
    let index = this.data.cards.findIndex(item => item.uid === card.uid)
    if (index >= 0) { // 编辑
      this.data.cards.splice(index, 1, card)
      this.data.selectedCard = card
    } else { // 新增
      this.data.cards.push(card)
    }

    this.updateUI(this.data.cards)
  },

  saveToPhotosAlbum(card) {
    Promise.all([card.frontImg && saveImageToPhotosAlbum(card.frontImg), card.backImg && saveImageToPhotosAlbum(card.backImg)]).then(res => {
      wx.showToast({
        title: Locale.t('saveToAlbum'),
        icon: 'none'
      })
    }).catch(err => {
      wx.showToast({
        title: Locale.t('failedToSaveToAlbum'),
        icon: 'none'
      })
    })
  },

  gotoWaterPrint(card) {
    const that = this
    wx.navigateTo({
      url: '/pages/waterprint/print',
      events: {
      },
      success(res) {
        res.eventChannel.emit('passParams', card)
      }
    })
  },

  gotoEdit(card) {
    const that = this
    wx.navigateTo({
      url: '/pages/edit/edit',
      events: {
        cardChanged: function(data) {
          that.onCardChanged(data)
        }
      },
      success(res) {
        res.eventChannel.emit('passParams', card)
      }
    })
  },

  removeCardFromUI(card) {
    console.log('removeCardFromUI: ', card)
    let index = this.data.cards.findIndex(item => item.uid === card.uid)

    this.data.cards.splice(index, 1)

    this.updateUI(this.data.cards)

    this.resetToStack()
  },

  removeCard(card) {
    let index = this.data.cards.findIndex(item => item.uid === card.uid)
    if (index < 0) {
      wx.showModal({
        title: Locale.t('failedToRemoveCard'),
        content: Locale.t('cardNotExists'),
        showCancel: false
      })
      return
    }


    if (card.isDemo) {
      removeDemoCard(card)
      this.removeCardFromUI(card)
      return
    } 

    const that = this

    wx.showLoading({
      title: Locale.t('removing')
    })

    deleteCard(card).then(cards => {
      console.log('deleteCard success callback: ', cards)

      that.removeCardFromUI(card)
    }).finally(() => {
      wx.hideLoading()
    })
  },

  onShareAppMessage: function() {

  }
})