const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
/* const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
}); */
const { v4: uuidV4 } = require('uuid')
const short = require('short-uuid');
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true
});

const mongo = require('mongodb').MongoClient


//const recordScreen = require('record-screen')

// rendering views, using ejs lib
app.set('view engine', 'ejs')
// setting up static folder -> all of js, css in *public* folder
app.use(express.static('public'))

app.use('/peerjs', peerServer)

app.get('/', (req, res) => {
    res.render('homepage')
})
app.get('/meet', (req, res) => {
  res.render('meetjoin')
})

app.get('/home', (req, res) => {
    // res.redirect(`/${uuidV4()}`)
    res.redirect(`chat/${short.generate()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room})
})

app.get('/chat/:chatroom', (req, res) => {
    res.render('chatroom', { chatroomId: req.params.chatroom})
})

// url : mongodb://app url/db name
// var url = 'mongodb://127.0.0.1/mongochat'

const dbName = 'mongochat'
var url = 'mongodb://127.0.0.1'

mongodb+srv://Rishika_01:Teamsclone_01@cluster0.uso0x.mongodb.net/mongochat?retryWrites=true&w=majority
mongo.connect(process.env.MONGODB_URI, { useNewUrlParser: true }, function(err, client){
    if(err){
        throw err;
    }

    console.log('Mongo db connected')

    const db = client.db(dbName)

    //runs anytime a user connects to web page
    //join-room is event
    io.on('connection', socket => {
        socket.on('join-room', (roomId, userId) => {
            // for current socket to join a room
            socket.join(roomId)
            // send a msg to everyone in the room that a new user connected
            socket.broadcast.to(roomId).emit('user-connected', userId)

            // socket.on('message', message => {
            //     io.to(roomId).emit('createMessage', message)
            // })
            // console.log("NEXT IS TYPE OF ROOMid", typeof roomId, roomId)
            let chat = db.collection(roomId);

            // Get chats from rromid collection
            chat.find().toArray(function(err, res){ // removed {} => find({})
                if(err){
                    throw err
                }
                //console.log('IN EMIT', res)
                // Emits the message
                socket.emit('output', res) 
            })

            //  Handling input
            socket.on('input', function(data){
                let name = data.name;
                let message = data.message;
                // IF name or message are blank do nothing
                if(name == '' || message == ''){
                    console.log("No name provided, can not send msgs");
                }
                else {
                    // Insert the message to collection
                    chat.insertOne({name: name, message: message}, function(){
                        io.emit('output', [data]);
                    })
                }
            })


            socket.on('disconnect', () => {
                socket.broadcast.to(roomId).emit('user-disconnected', userId)
            })
        })

        socket.on('join-chatRoom', (chatRoomId) => {
            //console.log("in chat room")
            socket.join(chatRoomId)

            let chat = db.collection(chatRoomId);
            //console.log(chatRoomId)
            chat.find().limit(100).sort({_id:1}).toArray(function(err, docs){
                if(err){
                    throw err;
                }
    
                // Emit the messages
                // console.log('sending previous messages', docs);
                socket.emit('load msgs', docs);
            });
            // chat.find({}, function(err, docs) {
            //     if(err) throw err;
            //     console.log('sending previous messages', docs);
            //     // socket.emit("load old msg", docs);
            // });

            //  Handling input
            socket.on('input', function(data){
                //console.log("IN INPUT")
                let name = data.name;
                let message = data.message;
                // IF name or message are blank do nothing
                if(name == '' || message == ''){
                    console.log("No name provided, can not send msgs");
                }
                else {
                    // Insert the message to collection
                    //console.log("IN INPUT IOIOIOI")
                    chat.insertOne({name: name, message: message}, function(){
                        io.emit('load msgs', [data]);
                    })
                }
            })
        })
    })
})


server.listen(process.env.PORT || 3000)