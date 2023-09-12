const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join-conference', (roomId, userName, userId) => { // Include the userName parameter here
    console.log(`User joined conference: Room ${roomId}, User ${userName} (ID: ${userId})`);
    socket.join(roomId);
    connectedUsers.set(socket.id, { userId, userName, screenSharing: false }); // Save the userName along with the userId
    io.to(roomId).emit('new-user', userName); // Emit the userName instead of the userId to other users in the room

    const connectedUserIds = Array.from(connectedUsers.entries()).map(([socketId, user]) => ({
      userId: user.userId,
      userName: user.userName, // Include the userName here
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
  console.log(`Serverrrrr is running on port ${port}`);
});
