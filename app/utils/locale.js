const language = wx.getSystemInfoSync().language

const zh = {
  homeTitle: '卡包',
  loading: '加载中...',
  saveToAlbum: '保存到相册',
  addWatermark: '添加水印',

  savedToAlbum: '已保存到相册',
  failedToSaveToAlbum: '保存到相册失败',

  removeCardTitle: '移除卡片',
  removeCardMessage: '移除之后不可恢复',
  remove: '移除',

  removing: '移除中',

  failedToRemoveCard: '移除卡片失败',
  cardNotExists: '该卡片不存在',

  copySuccess: '复制成功',

  change: '更换',
  delete: '删除',

  deletePicture: '删除图片',
  deletePictureMessage: '删除后可再次添加',

  warning: '提示',
  cardPicRequired: '请添加卡片图片',

  save: '保存',
  saving: '保存中...',

  error: '出错了',

  failedToSaveCard: '保存卡片失败',
  failedToSavePic: '保存图片失败',

  updateCard: '更新卡片',
  newCard: '新建卡片',

  cardNum: '卡号'
}

const en = {
  homeTitle: 'Cards',
  loading: 'Loading...',
  saveToAlbum: 'Save to album',
  addWatermark: 'Add watermark',

  savedToAlbum: 'Saved to album',
  failedToSaveToAlbum: 'Failed to save',

  removeCardTitle: 'Removing Card',
  removeCardMessage: 'Are you are sure?',
  remove: 'Remove',

  removing: 'Removing',

  failedToRemoveCard: 'Failed to remove card',
  failedToRemoveCard: 'Card not exists',

  copySuccess: 'Copied',


  change: 'Change',
  delete: 'Delete',

  deletePicture: 'Delete picture',
  deletePictureMessage: 'You can add a new picture after deleting',

  warning: 'Warning',
  cardPicRequired: 'Card picture is required',

  save: 'Save',
  saving: 'Saving...',

  error: 'Error',

  failedToSaveCard: 'Failed to save card',
  failedToSavePic: 'Failed to save picture',

  updateCard: 'Update Card',
  newCard: 'New Card',

  cardNum: 'No.'
}

const langs = {
  zh, en
}

const t = function (key) {
  const lang = langs[language]

  return lang[key]
}

export default {
  t
}