//app.js

import {
  KEY_LAUNCH_TIMES, KEY_CARDS
} from './utils/constant.js'


App({
  onLaunch: function () {
    let launchTimes = (wx.getStorageSync(KEY_LAUNCH_TIMES) || 0) + 1
    wx.setStorageSync(KEY_LAUNCH_TIMES, launchTimes)

    if (launchTimes <= 1) {
      let demoCards = [
        {
          uid: 'demo-01',
          frontImg: '/images/idcard.png',
          backImg: '/images/idcard-back.png',
          num: 'XXXXXXXXXXXXXXXXXX'
          
        },
        {
          uid: 'demo-02',
          frontImg: '/images/bankcard.png',
          backImg: '/images/bankcard-back.png',
          num: '0000 0000 0000 0000'
        }
      ]

      let cards = wx.getStorageSync(KEY_CARDS) || demoCards
      
      wx.setStorageSync(KEY_CARDS, cards)
    }
  },
  globalData: {
    userInfo: null
  }
})