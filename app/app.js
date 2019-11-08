//app.js

wx.cloud.init({
  // env: 'dev-1ant5',
  env: 'prod-duarc',
  traceUser: true
})

require('./utils/extension.js')

import {
  KEY_LAUNCH_TIMES,
  KEY_CARDS
} from './utils/constant.js';
import uniqueid from './utils/uid.js';

const fileManager = wx.getFileSystemManager();


App({
  onLaunch: function() {

    let launchTimes = (wx.getStorageSync(KEY_LAUNCH_TIMES) || 0) + 1
    wx.setStorage({
      key: KEY_LAUNCH_TIMES,
      data: launchTimes
    })

    if (launchTimes <= 1) {
      this.globalData.isFirstTime = true

      let {
        insertDemoCards
      } = require('/utils/index.js')

      insertDemoCards()
    }
  },

  device: wx.getSystemInfoSync(),
  
  globalData: {},

  restoreData() {
    fileManager.getSavedFileList({
      success(res) {
        // console.log(res.fileList)
        let picGroups = {

        }
        for (let file of res.fileList) {

          let found = false
          for (let time in picGroups) {
            if (Math.abs(time - file.createTime) < 5) {
              picGroups[time].push(file)
              found = true
            }
          }

          if (!found) {
            picGroups[file.createTime] = [file]
          }
        }

        let cards = []
        for (let g in picGroups) {
          let card = {
            uid: uniqueid(),
            num: '',
            frontImg: picGroups[g][0].filePath,
            backImg: picGroups[g].length > 1 ? picGroups[g][1].filePath : null
          }

          cards.push(card)
        }

        console.log('restore: ', cards)

        // wx.setStorageSync(KEY_CARDS, cards)
        wx.setStorage({
          key: KEY_CARDS,
          data: cards,
          fail(err) {
            console.log(err, '??????')
          }
        })
      }
    })
  }
})