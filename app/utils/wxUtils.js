
function saveContactToSystem(contact, savePhoto = true) {
  return new Promise((resolve, reject) => {

    let wxContact = Object.assign({}, contact)

    if (contact.photo && savePhoto) {
      if (/https:\/\//.test(contact.photo) || /http:\/\//.test(contact.photo)) {
        wx.showLoading({
          title: '加载中...',
          mask: true
        }) // 由于在 iPhone7p 上出现，点击 wx.addPhoneContact 的 mask，actionsheet 取消，但不调用 fail 回调的情况。故只在网络请求时，使用 loading
        wx.downloadFile({
          url: contact.photo,
          success: res => {
            wx.hideLoading()
            if (res.statusCode === 200) {
              wxContact.photoFilePath = res.tempFilePath;

              saveToPhone(wxContact).then(res => {
                resolve(res)
              }).catch(err => {
                reject(err)
              })
            }
          },
          fail: (err) => {
            wx.hideLoading()
            console.log('=', err)
            reject(err)
          }
        })
      }
    } else {

      saveToPhone(wxContact).then(res => {
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    }
  })
}

function saveToPhone(contact) {
  return new Promise((resolve, reject) => {
    wx.addPhoneContact({
      photoFilePath: contact.photoFilePath,
      firstName: contact.name,
      mobilePhoneNumber: contact.phone,
      weChatNumber: contact.wechat,
      organization: contact.company,
      title: contact.occupation,
      email: contact.email,
      success: res => {
        console.log(res)
        resolve(res)
      },
      fail: err => {
        console.log('saveToPhone:', err)
        const error = new Error(err.errMsg)
        reject(error)
      }
    });
  })
}

function gotoTucao() {
  const device = wx.getSystemInfoSync()

  wx.getNetworkType({
    success: function(res) {
      // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
      const networkType = res.networkType

      wx.navigateToMiniProgram({
        appId: '',
        extraData: {
          id: '',
          customData: {
            clientInfo: [device.pixelRatio, device.fontSizeSetting].join(', '),
            clientVersion: [device.version, device.SDKVersion, ].join(),
            os: [device.brand, device.model, device.platform].join(),
            netType: networkType,
            // osVersion: device.version,
            customInfo: null
          }
        }
      })

    }
  })
}

function handleAuthorization(scope, action) {
  if (!scope || !action) {
    throw new Error('scope 和 action 不能为空')
  }
  wx.getSetting({
    success: res => {
      if (!res.authSetting[scope]) { // 未授权 or 拒绝过授权
        wx.authorize({
          scope: scope,
          success: authRes => {
            action()
          },
          fail: authErr => {
            wx.showModal({
              title: '请先授权',
              content: '点击确定，将打开授权设置页面',
              success: function(res) {
                if (res.confirm) {
                  wx.openSetting()
                } else if (res.cancel) {
                  wx.showToast({
                    title: '未授权',
                    icon: 'none'
                  })
                }
              }
            })
            console.log('authErr', authErr)
          }
        })
      } else { // 已经授权
        action()
      }
    }
  })

}

function saveImageToPhotosAlbum(filePath) {
  return new Promise((resolve, reject) => {
    handleAuthorization('scope.writePhotosAlbum', res => {
      wx.saveImageToPhotosAlbum({
        filePath: filePath,
        success: suc => {
          resolve(suc)
        },
        fail: err => {
          reject(err)
        }
      })
    })
  })
}

function removeFileIfExists(path) {
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

}


function chooseImage(param = {}) {

  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: param.count || 1,
      sizeType: param.sizeType || ['compressed'],
      success: function(res) {

        let path = res.tempFilePaths[0]

        wx.getImageInfo({
          src: path,
          success(res) {
            let image = {
              path: path,
              localPath: path,
              width: res.width,
              height: res.height,
              type: res.type
            }

            resolve(image)
          },
          fail(err) {
            reject(err)
          }
        })

      },
      fail(err) {
        reject(err)
      }
    })
  })



}

function getFileList() {
  return new Promise((resolve, reject) => {
    wx.getSavedFileList({
      success(res) {
        resolve(res.fileList)
      }
    })
  }) 
 
}

function downloadFile(data) {
  return new Promise((resolve, reject) => {
    wx.cloud.downloadFile({
      fileID: data.fileID || data.url,
      success(res) {
        console.log('download file success: ', res)
        
        wx.getFileSystemManager().saveFile({
          tempFilePath: res.tempFilePath,
          // filePath: data.filePath,
          success(res) {
            resolve(res.savedFilePath)
          },
          fail(err) {
            reject(err)
          }
        })
        
      },
      fail(err) {
        reject(err)
      }
    })
  })
 
}

function uploadFile(tempPath, cloudPath) {
  console.log('uploadFile: ', tempPath, cloudPath)
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath: cloudPath, // 上传至云端的路径
      filePath: tempPath, // 小程序临时文件路径
      success: res => {
        let fileID = res.fileID

        wx.saveFile({
          tempFilePath: tempPath,
          success(res) {
            resolve({
              savedFilePath: res.savedFilePath,
              fileID: fileID,
              cloudPath: fileID
            })
          },
          fail(err) {
            reject(err)
          }
        })
      },
      fail(err) {
        reject(err)
      }
    })
  })
  
}

module.exports = {
  saveContactToSystem: saveContactToSystem,
  gotoTucao: gotoTucao,
  handleAuthorization,
  saveImageToPhotosAlbum,
  chooseImage, 
  getFileList,
  downloadFile,
  uploadFile,
  removeFileIfExists
}