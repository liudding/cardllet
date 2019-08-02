function now() {
  var time = Date.now();
  var last = now.last || time;
  return now.last = time > last ? time : last + 1;
}

function random() {
  return Math.round(Math.random() * 100000)
}

export default function () {
  return now().toString(36) + random().toString(36)
}