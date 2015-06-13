var sending = false
var socket = new WebSocket(window.webSocketEndpoint)
var imageContainers = []
var cycleStep = 0
var textToSend = ''

navigator.getMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia

socket.onopen = initPage

function initPage () {
  socket.send(JSON.stringify({
    channel: 'sender receiver'
  }))

  socket.onmessage = handleMessage

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

  setInterval(cycleImages, 100)
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
    var text = document.getElementById('text')
    event.preventDefault()
    if (sending) {
      return
    }
    textToSend = text.value
    text.value = ''
    sending = true
    document.querySelector('aside').className = 'sending'
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
    enableSending()
  }
}

function sendImages (images) {
  socket.send(JSON.stringify({
    text: textToSend,
    images: images
  }))
  enableSending()
}

function enableSending() {
  document.querySelector('aside').className = '';
  sending = false
}
function handleMessage (message) {
  message = JSON.parse(message.data)
  appendMessage(message)
  limitMessageCount()
  autoScroll()
}

function appendMessage(message) {
  var messageContainer = document.createElement('div')
  var images = message.images.map(function (src) {
    return '<img src="' + src + '">'
  }).join('')
  var imagesContainer = '<div class="message-images">' + images + '</div>'
  var text = '<p class="message-text">' + message.text + '</p>'
  messageContainer.className = 'message'
  messageContainer.innerHTML = imagesContainer + text
  document.querySelector('main').appendChild(messageContainer)
  imageContainers.push(messageContainer.firstChild)
}

function limitMessageCount() {
  var messages = document.querySelectorAll('.message')
  if (messages.length > 5) {
    imageContainers.shift()
    messages[0].parentNode.removeChild(messages[0])
  }
}

function cycleImages() {
  var oldStep = cycleStep

  cycleStep = (cycleStep + 1) % 20
  imageContainers.forEach(function (container) {
    var images = container.childNodes
    images.item(oldStep).style.display = 'none'
    images.item(cycleStep).style.display = 'block'
  })
}

function autoScroll() {
  window.setTimeout(function () {
    window.scrollTo(0, 999999)
  }, 100);
}
