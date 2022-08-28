const express = require("express")
const app     = express()
const server  = require('http').createServer(app)
const io      = require('socket.io')(server)

// Generate auth code for the control panel
const authCode = Math.floor(Math.random() * (99999 - 10000) ) + 10000

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile( __dirname + '/userInterface.html')
})

app.get('/control', (req, res) => {
    //req.query.code == authCode
    // Replace the following line w/ true for testing,
    // Otherwize use the auth code check at the top of this function.
    if(req.query.code == authCode) {
        res.sendFile( __dirname + '/controlPanel.html')
    } else {
        res.sendFile(__dirname + '/accessDenied.html')
    }
})

app.get('*', (req, res) => {
    res.sendFile(__dirname + '/accessDenied.html')
})

io.on('connection', (socket) => {
    socket.on('adminEvent', (data) => {
        io.emit('serverEvent', data)
    })
    socket.on('uiAction', (data) => {
        io.emit('consoleUpdate', data)
    })
})

function consoleBoxDisplay(message) {
    let dist = message.length + 2
    console.log(`╔${"═".repeat(dist)}╗`)
    console.log(`║ ${message} ║`)
    console.log(`╚${"═".repeat(dist)}╝`)
}

server.listen(80, () => {
    consoleBoxDisplay(`Server Online...`)
    consoleBoxDisplay(`Auth Code: ${authCode}`)
})
