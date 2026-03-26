import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST']
  }
});

// In-memory store
// rooms: Map<roomId, { id, name, users: Array, messages: Array }>
const rooms = new Map();

// Initialize generic default room
rooms.set('general', { id: 'general', name: 'General', users: [], messages: [], isPrivate: false });

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', ({ roomId, user, isPrivate, password }) => {
    if (rooms.has(roomId)) {
      const existingRoom = rooms.get(roomId);
      if (existingRoom.isPrivate && existingRoom.password !== password) {
        socket.emit('join_error', '비밀번호가 일치하지 않습니다.');
        return;
      }
    } else {
      rooms.set(roomId, { 
        id: roomId, 
        name: roomId, 
        users: [], 
        messages: [],
        isPrivate: !!isPrivate,
        password: password || ''
      });
      io.emit('room_update');
    }

    const room = rooms.get(roomId);
    socket.join(roomId);
    
    if (user) {
      const existingUser = room.users.find(u => u.uid === user.uid);
      if (!existingUser) {
        room.users.push({ ...user, socketId: socket.id });
      } else {
        existingUser.socketId = socket.id;
      }
    }
    
    socket.emit('join_success', roomId);
    socket.emit('room_data', room);
    io.to(roomId).emit('room_update', room);
    io.emit('room_update');
  });

  socket.on('leave_room', ({ roomId, userUid }) => {
    const room = rooms.get(roomId);
    if (room && userUid) {
      room.users = room.users.filter(u => u.uid !== userUid);
      socket.leave(roomId);
      io.to(roomId).emit('room_update', room);
      io.emit('room_update');
    }
  });

  socket.on('send_message', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (room) {
      message.readBy = [message.sender.uid];
      room.messages.push(message);
      io.to(roomId).emit('receive_message', message);
    }
  });

  socket.on('mark_read', ({ roomId, userUid }) => {
    const room = rooms.get(roomId);
    if (room && userUid) {
      let updated = false;
      room.messages.forEach(msg => {
        if (!msg.readBy) msg.readBy = [];
        if (!msg.readBy.includes(userUid)) {
          msg.readBy.push(userUid);
          updated = true;
        }
      });
      if (updated) {
        io.to(roomId).emit('room_data', room);
      }
    }
  });

  socket.on('get_rooms', () => {
    const roomList = Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      usersCount: r.users.length,
      isPrivate: r.isPrivate
    }));
    socket.emit('room_list', roomList);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      const userIndex = room.users.findIndex(u => u.socketId === socket.id);
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        io.to(roomId).emit('room_update', room);
      }
    }
    io.emit('room_update');
  });
});

// -------- Serve Frontend in Production --------
// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Anything that doesn't match the above, send back the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
// ----------------------------------------------

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`Socket.io Server listening on port ${PORT}`);
});
