// holds all current sessions 
let sessions = {}
// session.code = {script: array of lines,
//                 currLine: 0 (idx of script),
//                 code: , 
//                 status: 'progress}???

// create session with script, currLine = 0, code
// send to people in room :)
export function setLesson(data) {
    // data == [code, script]
    let code = parseInt(data[0])
    let scriptData = data[1]
    let title = scriptData.title
    let lines = scriptData.lines
    let description = scriptData.description || script.objective || ''

    sessions[code] = {
        script: lines,
        title: title,
        code: code,
        currLine: 0,
        status: 'in progress',
        description: description
    }

    return sessions[code]
}

// given code, find session, increment currLine
export function nextLine(data) {
    // data == code
    // get code and test if a room
    let session = sessions[parseInt(data)]
    // if not room, return null
    if (session == null) {
        return null
    }
    session.currLine += 1
    // console.log("curr sessions: " + sessions)
    // console.log("edited session: " + session.currLine)
    return session
}

export function finishScript(data) {
     // data == code
    // get code and test if a room
    let session = sessions[parseInt(data)]
    // if not room, return null
    if (session == null) {
        return null
    }


    session.status = 'finished'
    return session
}

export function endLesson(data) {
    // remove session from sessions holder
    let session = sessions[parseInt(data)] 
    if (session == null) {
        return
    }

    delete sessions[session]
}

