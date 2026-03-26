import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

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
rooms.set('general', { id: 'general', name: 'General', users: [], messages: [] });

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a room
  socket.on('join_room', ({ roomId, user }) => {
    socket.join(roomId);
    
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { id: roomId, name: roomId, users: [], messages: [] });
    }
    
    const room = rooms.get(roomId);
    
    // Add user to room's active user list if not already present
    // using user.uid (Firebase UID)
    if (user && !room.users.find(u => u.uid === user.uid)) {
      room.users.push(user);
    }
    
    // Send previous messages and current room state to the joining user
    socket.emit('room_data', room);
    
    // Broadcast to others in the room that user joined
    io.to(roomId).emit('room_update', room);
    console.log(`User ${user?.displayName || 'Anonymous'} joined room ${roomId}`);
  });

  // Handle receiving a message
  socket.on('send_message', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.messages.push(message);
      // Broadcast message to everyone in the room (including sender)
      io.to(roomId).emit('receive_message', message);
    }
  });

  // Serve available rooms
  socket.on('get_rooms', () => {
    const roomList = Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      usersCount: r.users.length
    }));
    socket.emit('room_list', roomList);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // A robust implementation would remove the user from all rooms they were in
  });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`Socket.io Server listening on port ${PORT}`);
});
