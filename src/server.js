import 'dotenv/config'
import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'

import * as game from './controllers/gameRoomController.js'
import * as cl from './controllers/coLearningController.js'

// init app and port
const app = express();
const PORT = Number(process.env.PORT || 3001);
const server = createServer(app);

// need to use cors to allow a specific url to connect
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://project-puente.onrender.com/']
  }
})

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

  socket.on('setLesson', (data) => {
    let sessionData = cl.setLesson(data)
    io.to(parseInt(data[0])).emit('sessionUpdate', sessionData)
  })

  socket.on('nextLine', (data) => {
    let sessionData = cl.nextLine(data)
    // console.log('session data: ' + sessionData + " code: " + data)
    io.to(parseInt(data)).emit('sessionUpdate', sessionData)
  })

  socket.on('finishLesson', (data) => {
    let sessionData = cl.finishScript(data)

    io.to(parseInt(data)).emit('sessionUpdate', sessionData)
  })

  // sets lesson to null so can choose another
  socket.on('endLesson', (data) => {
    cl.endLesson(data)
    console.log("end session: " + data)
    io.to(parseInt(data)).emit('sessionUpdate', null)
  })
});

io.listen(PORT)
