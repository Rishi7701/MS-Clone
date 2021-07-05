const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const formatMessage = require('./utils/messages');
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const { v4: uuidV4 } = require('uuid')

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
 // res.render('homepage',{ newroom: uuidV4() })
res.render('homepage')
//res.render('hmpage')
})
app.get('/home', (req, res) => {
  // res.render('homepage',{ newroom: uuidV4() })
  res.redirect(`/${uuidV4()}`)
 })
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    //console.log(roomId,userId)
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId)

    socket.on('message', (message) => {
      //send message to the same room
      const user = getCurrentUser(socket.id);
      io.to(user.room).emit('createMessage',formatMessage(user.username,message)) }); 

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(process.env.PORT||3000)