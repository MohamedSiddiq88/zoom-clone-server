const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: 'https://lustrous-rolypoly-be4e92.netlify.app',
    methods: ['GET', 'POST'],
  },
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join-conference', (roomId, userId) => {
    console.log(`User joined conference: Room ${roomId}, User ${userId}`);
    socket.join(roomId);
    connectedUsers.set(socket.id, { userId, screenSharing: false });
    io.to(roomId).emit('new-user', userId);

    const connectedUserIds = Array.from(connectedUsers.entries()).map(([socketId, user]) => ({
      userId: user.userId,
      screenSharing: socketId !== socket.id ? connectedUsers.get(socketId).screenSharing : false,
    }));
    socket.emit('user-list', connectedUserIds);
  });

  socket.on('chat-message', (roomId, userId, message) => {
    const chatMessage = { userId, message };
    io.to(roomId).emit('chat-message', userId, message);
  });

  socket.on('screen-sharing', (roomId, userId, screenSharing) => {
    io.emit('user-disconnected', userId);
    connectedUsers.get(socket.id).screenSharing = screenSharing;
    socket.to(roomId).emit('screen-sharing', userId, screenSharing);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    const user = connectedUsers.get(socket.id);
  
    if (user) {
      const { userId } = user;
      connectedUsers.delete(socket.id);
    
      io.emit('user-disconnected', userId);
    }
  });
});

const port = 3001;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
