import {
  getFileList,
  downloadFile,
  removeFileIfExists
} from './wxUtils.js'
import {
  KEY_CARDS, KEY_DEMO_CARDS
} from './constant.js'

const db = wx.cloud.database()
const cardsCollection = db.collection('cards')


function syncCards(params) {

  Promise.all([getFileList(), cardsCollection.get()]).then(values => {
    let localFileList = values[0]
    let cards = values[1].data

    console.log(`syncCards: there are ${localFileList.length} local files and ${cards.length} cards`)

    if (cards.length === 0) {
      wx.setStorage({
        key: KEY_CARDS,
        data: [],
      })

      params.complete && params.complete(cards)
      return
    }
    /**
     * 清理本地缓存的图片
     * cloud 端的，可由 云函数来清理
     */
    removeExpiredCache(localFileList, cards)

    for (let card of cards) {
      for (let image of card.images) {
        image.needCache = false

        let local = localFileList.find(file => file.filePath === image.localPath)
        if (local) {
          continue
        }
        // 本地不存在缓存文件
        image.needCache = true
      }
    }

    let syncedTimes = 0

    cards.forEach(card => {
      syncOneCard(card).then((syncedCard, newCached) => {
        syncedTimes++

        let index = cards.findIndex(item => item._id === syncedCard._id)
        cards.splice(index, 1, syncedCard)

        params.progress && params.progress(syncedCard, cards, newCached)

        if (syncedTimes === cards.length) {
          wx.setStorage({
            key: KEY_CARDS,
            data: cards,
          })
          params.complete && params.complete(cards)
        }
      })
    })
  }).catch(err => {
    params.fail && params.fail(err)
  })
}

function syncOneCard(card) {
  return new Promise((resolve, reject) => {
    let images = card.images.filter(item => item.needCache)

    if (images.length === 0) {
      resolve(card, false)
      return
    }

    console.log('begin download images for card: ', card)

    let promises = images.map(image => {
      return downloadFile({
        fileID: image.path,
        filePath: image.localPath
      })
    })

    Promise.all(promises).then(values => {
      for (let i = 0; i < images.length; i++) {
        let image = images[i]

        image.localPath = values[i]

        let targetImage = card.images.find(item => item.path === image.path)
        targetImage.localPath = values[i]
      }

      // 更新 cloud  数据
      let temp = Object.assign({}, card)
      delete temp._openid
      delete temp._id
      delete temp.frontImg
      delete temp.backImg

      cardsCollection.doc(card._id).update({
        data: temp
      }).then(res => {
        resolve(card, true)
      })
    }).catch(err => {
      reject(err)
    })
  })
}

function formateCard(card) {
  if (!card) {
    console.error('formate card: empty card')
    return null
  }
  console.log('formate card', card)
  card.frontImg = card.images.length > 0 ? card.images[0].localPath : ''

  card.backImg = card.images.length > 1 ? card.images[1].localPath : ''

  return card
}

function deleteCard(card) {
  return new Promise((resolve, reject) => {
    cardsCollection.doc(card._id).remove().then(res => {

      // 删除 cloud 图片
      let fileList = card.images.map(item => item.path)
      wx.cloud.deleteFile({
        fileList: fileList,
        success: res => {},
        fail: console.error
      })

      // 删除本地缓存文件
      card.images.forEach(item => {

        removeFileIfExists(item.localPath)
      })

      removeCachedCard(card)

      resolve()
    }).catch(err => {
      reject(err)
    })
  })
}

function removeCachedCard(card) {
  let cards = wx.getStorageSync(KEY_CARDS)
  let index = cards.findIndex(item => item.uid === card.uid)

  cards.splice(index, 1)

  try {
    wx.setStorageSync(KEY_CARDS, cards)
  } catch (err) {

  }
}

function removeExpiredCache(localFileList, cards) {

  let images = cards.reduce((arr, cur) => {
    return arr.concat(cur.images)
  }, [])

  let promises = []

  for (let file of localFileList) {

    let valid = images.find(image => file.filePath === image.localPath)
    if (valid) {
      continue
    }

    // 
    promises.push(removeFileIfExists(file.filePath))
  }

  console.log('removeExpiredCache: ', promises.length + ' files to remove')

  Promise.all(promises).then(res => {
    console.log(`removeExpiredCache done: ${res.length} / ${localFileList.length} was removed`)
  })
}

function insertDemoCards() {
  console.log('insert demo cards')

  let demoCards = [{
      isDemo: true,
      uid: 'demo-01',
      num: 'XXXXXXXXXXXXXXXXXX',
      images: [{
          localPath: '/images/idcard.png'
        },
        {
          localPath: '/images/idcard-back.png'
        }
      ]

    },
    {
      isDemo: true,
      uid: 'demo-02',
      num: '0000 0000 0000 0000',
      images: [{
          localPath: '/images/bankcard.png'
        },
        {
          localPath: '/images/bankcard-back.png'
        }
      ]
    }
  ]

  try {
    wx.setStorageSync(KEY_DEMO_CARDS, demoCards)
  } catch (err) {
    console.log('【 WEAPP ERROR 】: ', err)
  }

  return demoCards 
}

function removeDemoCard(card) {
  let demoCards = wx.getStorageSync(KEY_DEMO_CARDS)
  let index = demoCards.findIndex(item => item.uid === card.uid)

  demoCards.splice(index, 1)

  try {
    wx.setStorageSync(KEY_DEMO_CARDS, demoCards)
  } catch (err) {

  }
  
}


module.exports = {
  syncCards,
  formateCard,
  deleteCard,
  removeCachedCard,
  removeExpiredCache,
  insertDemoCards,
  removeDemoCard
}