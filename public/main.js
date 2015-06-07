var sending = false
var socket = new WebSocket(window.webSocketEndpoint)

navigator.getMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia

socket.onopen = initPage

function initPage () {
  navigator.getMedia({
    audio: false,
    video: {
      optional: [
        { minWidth: 640 },
        { minHeight: 480 },
        { minAspecRatio: 4 / 3 }
      ]
    }
  }, streamSuccess, streamError)
}

function streamSuccess (stream) {
  var video = document.querySelector('video')
  if (video.mozSrcObject) {
    video.mozSrcObject = stream
  } else {
    video.src = window.URL.createObjectURL(stream)
  }
  video.onloadedmetadata = function () {
    video.play()
    initSender(video)
  }
}

function streamError (err) {
  console.log(err.name)
}

function initSender (video) {
  document.getElementById('send').addEventListener('submit', function (event) {
    event.preventDefault()
    if (sending) {
      return
    }
    sending = true
    startCapture(video)
  })
}

function startCapture (video) {
  var canvas = document.createElement('canvas')
  canvas.width = video.clientWidth
  canvas.height = video.clientHeight
  var context = canvas.getContext('2d')
  captureImages([], {
    count: 20,
    context: context,
    canvas: canvas,
    video: video
  }, sendImages)
}

function captureImages (images, options, callback) {
  try {
    options.context.drawImage(
      options.video,
      0,
      0,
      options.canvas.width,
      options.canvas.height
    )
    images.push(options.canvas.toDataURL('image/jpeg'))
    options.count -= 1
    if (options.count) {
      window.setTimeout(function () {
        captureImages(images, options, callback)
      }, 100)
    } else {
      callback(images)
    }
  } catch (e) {
    console.log('Error capturing images ' + e.message)
    sending = false
  }
}

function sendImages (images) {
  sending = false

  socket.send(JSON.stringify({
    text: document.getElementById('text').value,
    images: images
  }))
}
