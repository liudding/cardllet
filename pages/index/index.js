//index.js
//获取应用实例
const app = getApp()

import {
  KEY_CARDS
} from '../../utils/constant.js'

import {
  saveImageToPhotosAlbum
} from '../../utils/wxUtils.js'

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

  onTapCard(event) {
    let index = event.currentTarget.dataset.index
    let card = event.currentTarget.dataset.item

    // 当已经选中了一张卡片之后，点击其他卡片，则不相应
    // 由于隐藏其他卡片使用的是 opacity，隐藏掉的卡片仍然会占用空间，也会触发此事件。所有使用这各 trick 来解决
    if (this.data.selectedCard) {
      if ( this.data.selectedCard.uid !== card.uid) { // 点击了其他卡片
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

  onLoad: function() {
    let cards = wx.getStorageSync(KEY_CARDS) || []
    this.setData({
      cards: cards
    })
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
      if (!card.frontImg) {
        wx.showToast({
          title: '该卡片无图片',
          icon: 'none'
        })
        return
      }
      Promise.all([card.frontImg && saveImageToPhotosAlbum(card.frontImg), card.backImg && saveImageToPhotosAlbum(card.backImg)]).then(res => {
        wx.showToast({
          title: '已保存到相册',
          icon: 'none'
        })
      }).catch(err => {
        wx.showToast({
          title: '保存到相册失败',
          icon: 'none'
        })
      })
    } else if (index === 1) { // 编辑
      this.gotoEdit(card)
    } else if (index === 2) { // 删除
      wx.showModal({
        title: '移除卡片',
        content: '移除之后不可恢复',
        confirmColor: '#FF6C6C',
        confirmText: '移除',
        success(res) {
          if (res.confirm) {
            let cards = that.removeCard(card)
            that.setData({
              cards: cards
            })
            that.resetToStack()
          }
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
          title: '复制成功',
          icon: 'none'
        })
      }
    })
  },

  onCardChanged(data) {
    let index = this.data.cards.findIndex(item => item.uid === data.uid)
    if (index >= 0) {
      this.data.cards.splice(index, 1, data)
    } else {
      this.data.cards.push(data)
    }

    this.setData({
      cards: this.data.cards
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

  removeCard(card) {
    let cards = wx.getStorageSync(KEY_CARDS) || []

    let index = cards.findIndex(item => item.uid === card.uid)
    if (index < 0) {
      wx.showModal({
        title: '移除卡片失败',
        content: '该卡片不存在',
        showCancel: false
      })
      return
    }

    cards.splice(index, 1)

    wx.setStorageSync(KEY_CARDS, cards)

    return cards
  }
})