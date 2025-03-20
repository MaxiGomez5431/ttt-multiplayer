import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

const rooms = {}

function getOtherElement (set, element) {
  const array = Array.from(set)
  const index = array.indexOf(element)

  // Si el elemento está en el array, devuelve el otro
  if (index !== -1) {
    // Devuelve el otro elemento
    return array[1 - index]
  }

  // Si el elemento no se encuentra, devuelve undefined o maneja el error de la manera que desees
  return undefined
}

app.get('/', (req, res) => {
  res.send('Back online and funcional')
})

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado')

  socket.on('mensaje', (data) => {
    console.log('Mensaje recibido:', data)
    io.emit('mensaje', `El servidor reenvia el mensaje: ${data}`)
  })

  socket.on('joinRoom', (roomId) => {
    console.log(`Se inició el socket.on joinRoom en este id: ${roomId} `)

    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: new Set(),
        actualPlayer: null
      }
      rooms[roomId].players.add(socket.id)
      rooms[roomId].actualPlayer = socket.id
      console.log(`Se creó la sala con id: ${roomId}`)
      console.log(`Usuario se conectó a la sala: ${roomId}`)
      socket.join(roomId)
      io.to(roomId).emit('updatePlayers', Array.from(rooms[roomId].players))
      io.to(roomId).emit('mensaje', `Te conectaste a la sala ${roomId}, tiene ${rooms[roomId].players.size} usuarios`)
    } else if (rooms[roomId].players.size < 2) {
      rooms[roomId].players.add(socket.id)
      console.log(`Usuario se conectó a la sala: ${roomId}`)
      socket.join(roomId)
      io.to(roomId).emit('updatePlayers', Array.from(rooms[roomId].players))
      io.to(roomId).emit('mensaje', `Te conectaste a la sala ${roomId}, tiene ${rooms[roomId].players.size} usuarios`)
    } else {
      socket.emit('roomFull')
    }

    socket.on('updateBoard', (board) => {
      const playerId = socket.id
      const otherPlayer = getOtherElement(rooms[roomId].players, rooms[roomId].actualPlayer)

      if (playerId === rooms[roomId].actualPlayer) {
        io.to(roomId).emit('emitBoard', board)
        io.to(roomId).emit('changeTurn')
        rooms[roomId].actualPlayer = otherPlayer
      }
    })

    socket.on('disconnect', () => {
      console.log(`Un usuario se ha desconectado: ${socket.id}`)
    })
  })
})

server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000')
})
