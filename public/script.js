const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
  //port:'3000'
})

let myVideoStream;
const myVideo = document.createElement('video')
var chatMessage = document.getElementById('chat_message')
var newUserName = document.getElementById('userpara')
var messages = document.getElementById('messages')

myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)

  myPeer.on('call',call =>{
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream',userVideoStream =>{
      addVideoStream(video,userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    console.log('user-connected'+ userId)
    setTimeout(() => {
      // user joined
      connectToNewUser(userId, stream)
    }, 1000)
  })
  // input value
  /* let text = $("input");
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('')
    }
  });
  socket.on("createMessage", message => {
    $("ul").append(`<li class="message"><b>Anonymous</b><br/>${message}</li>`);
    scrollToBottom()
  }) */
  socket.on('output', function(data){
    //console.log(data);
    if(data.length){
        for(var x = 0;x < data.length;x++){
            // Build out message div
            var message = document.createElement('div');
            message.setAttribute('class', 'chat-message');
            message.textContent = data[x].name+": "+data[x].message;
            messages.appendChild(message);
            // messages.insertBefore(message, messages.firstChild);
        }
    }
  });

  chatMessage.addEventListener('keydown', function(e){
    if(e.which === 13 && e.shiftKey == false){
        // Emit to server input
        socket.emit('input', {
            name:newUserName.value,
            message:chatMessage.value
        });
        
        chatMessage.value = ''

        e.preventDefault();
    }
})
})

socket.on('user-disconnected', userId => {
  console.log('user-disconnected'+ userId)
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })
  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

/* const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
} */

const newmeet = () =>{
  var newroom = document.createElement("textarea");
  newroom.value = short.generate()
  document.body.appendChild(newroom);
  //console.log(newroom)
  newroom.select()
  document.execCommand("copy")
  alert("Copied the newroom code: " + newroom.value);
  document.body.removeChild(newroom);
}
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}
/* const raise = () => {
  socket.
  alert(username.value+" raised hand" );
} */

const playStop = () => {
  //console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}