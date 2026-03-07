// number of digits in room code 
const DIGITS = 10000;
// objects to hold all room codes
let rooms = {}

// putting logic for game room creation/joining 

// when user connects to create room, generate 4 digit unique code
// then create and join a room w/ that code
export function createRoom(socket, data) {
    // data is room type information :)
    // loteria default
    let max = 8
    // if co-learning overwrite to 2 max players
    if (data === 'cl') {
        max = 2
    }

    // create room ID/code
    let code = Math.floor(DIGITS + Math.random()*DIGITS)
    console.log(`Code generated: ${code}`)
    rooms[code] = {users: [socket.id],
                    "code": code,
                    type: data,
                    roomID: data+"_"+code,
                    max: max,
                    status: 'waiting'}

    // attach socket to room and emit gameData
    console.log("Joining: " + code)
    socket.join(code)
    socket.emit('create', rooms[code])
    console.log(rooms)
}

export function leaveRoom(socket, data) {
    //console.log(data)
    //remove socket from room
    if (rooms[data] != null) {
        socket.leave(data)
        
        // remove user from users list
        let userList = rooms[data].users
        let idx = userList.indexOf(socket.id)
        if (idx > -1) {
            userList.splice(idx, 1) // del only the user id
        }

        // if last user to leave, del room
        if (userList.length <= 0) {
            delete rooms[data]
            return null
        }

        // if room still exists, return updated room info
        return rooms[data]
    } else {
        return null
    }

}

export function joinRoom(socket, data) {
    // data structured = [code, displayName]
    console.log(data)
    const roomCode = parseInt(data[0])
    if (!roomCode) {
        return null
    }

    const room = rooms[roomCode]
    // check if room code is valid
    if (room != null) {
      // check if space in room
      if (room.users.length < room.max) {
        // if valid, join room
        console.log("Joining: " + roomCode)
        socket.join(roomCode)
        if (!room.users.includes(socket.id)) {
            room.users.push(socket.id)
        }
        console.log(rooms)
        // return success + room info
        // emit to all users in the room so they get updated user list etc
        return room
      }
      
      // else no space in room to join,
      return null
    }
    // else return error: invalid room code
    return null
}

// given code set room status to active
export function startGame(data) {
    let room = rooms[data]
    // if no room
    if (room == null) {
        // return no data, error
        return null
    }

    // toggle room status
    room.status = 'active'
    // return updated room to all users
    return room
}
