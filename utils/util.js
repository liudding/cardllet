const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}


const fileInfos = (path) => {
  let infos = {
    path: path,
  };

  let filename = path

  let slashIndex = path.lastIndexOf("/");
  if (slashIndex >= 0) {
    filename = path.substring(slashIndex + 1);
  }

  let dotIndex = filename.lastIndexOf(".");
  if (dotIndex < 0) {
    infos.basename = filename;
    infos.ext = "";
  } else {
    infos.basename = filename.substring(0, dotIndex);
    infos.ext = filename.substring(dotIndex + 1);
  }

  return infos;
}

function deepCopy(obj, cache = []) {

  function find(list, f) {
    return list.filter(f)[0]
  }

  // just return if obj is immutable value
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // if obj is hit, it is in circular structure
  const hit = find(cache, c => c.original === obj)
  if (hit) {
    return hit.copy
  }

  const copy = Array.isArray(obj) ? [] : {}
  // put the copy into cache at first
  // because we want to refer it in recursive deepCopy
  cache.push({
    original: obj,
    copy
  })

  Object.keys(obj).forEach(key => {
    copy[key] = deepCopy(obj[key], cache)
  })

  return copy
}


module.exports = {
  formatTime: formatTime,
  fileInfos,
  deepCopy
}