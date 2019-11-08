// pages/more/more.js
Page({

  data: {
    apps: [{
      icon: '/images/fenziqian.png',
      name: '礼金份子钱',
      appId: 'wx9ca5d608dc08fa4e'
    }, {
      icon: '/images/poetryName.png',
      name: '古诗起名',
      appId: 'wx49ddf9db7be1dec0'
    }]
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {

  },

  onTapApp(event) {
    let index = event.currentTarget.dataset.index
    let app = event.currentTarget.dataset.item

    wx.navigateToMiniProgram({
      appId: app.appId,
    })
  },


  onShareAppMessage: function () {

  }
})