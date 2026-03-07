import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { Server } from 'socket.io'
import { createServer } from 'node:http'

import * as game from './controllers/gameRoomController.js'

// init app and port
const app = express();
// const PORT = Number(process.env.PORT || 3000);
const server = createServer(app);

// need to use cors to allow a specific url to connect
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173'
  }
})

// set up cors, morgan, json middleware
// app.use(cors())
// app.use(morgan('dev'))
// app.use(express.json())

// link router to base url
// app.use('/', router)

// basic fallback error handler
// app.use((err, _req, res, _next) => {
//   console.error(err);
//   res.status( err.status || 500).json({ error: (err.message || 'Unexpected server error') });
// });

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // disconnect (just console log)
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  // creates lobby
  socket.on('reqCreate', (data) => {
    game.createRoom(socket, data);
  })

  // exit room via code, emit updated data
  socket.on('exitRoom', (data) => {
    let roomData = game.leaveRoom(socket, data)
    io.to(data).emit('roomUpdate', roomData)
    // emit null to user so they remove all gameData info
    socket.emit('roomUpdate', null)
  })

  // sent by user to request to join a lobby via code
  socket.on('reqJoin', (data) => {
    let roomData = game.joinRoom(socket, data)
    if (!roomData) {
      socket.emit('roomJoinError', { message: 'Invalid room code.' })
      return
    }

    io.to(parseInt(data[0])).emit('roomUpdate', roomData)
    // send to socket that just joined, doesn't seem to get it from emit
    socket.emit('roomUpdate', roomData)
  })

  // sent by host when starting game,
  // data == code
  socket.on('startGame', (data) => {
    console.log('START GAME RECIEVED: ' + data)
    // make function to take code and set status to active
    let roomData = game.startGame(data)

    // emit status to all users in room
    // update room with status
    io.to(data).emit('roomUpdate', roomData)
  })
});

// the docs LIE TO YOU 
// YOU DO NOT NEED THIS
// only put server to listen
// // io.listen(PORT)

// set server to listen on port
// server.listen(PORT, () => {
//   console.log(`Puente API listening on port ${PORT}`);
// });
