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
rooms.set('general', { id: 'general', name: 'General', users: [], messages: [], isPrivate: false, creatorUid: 'system', password: '' });

const emitSafeRoomList = () => {
  const roomList = Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    usersCount: r.users.length,
    isPrivate: r.isPrivate,
    messagesCount: r.messages.length
  }));
  io.emit('room_update');
  io.emit('room_list', roomList);
};

const broadcastRoomUpdate = (room) => {
  const creatorUser = room.users.find(u => u.uid === room.creatorUid);
  if (creatorUser) {
    const creatorSocket = io.sockets.sockets.get(creatorUser.socketId);
    if (creatorSocket) {
      creatorSocket.emit('room_update', { filterMode: 'creator', ...room, password: room.password, bannedUids: room.bannedUids });
    }
  }
  const safeRoom = { filterMode: 'safe', ...room, password: undefined, bannedUids: undefined };
  for (const u of room.users) {
    if (u.uid !== room.creatorUid) {
      const socket = io.sockets.sockets.get(u.socketId);
      if (socket) socket.emit('room_update', safeRoom);
    }
  }
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', ({ roomId, user, isPrivate, password }) => {
    if (rooms.has(roomId)) {
      const existingRoom = rooms.get(roomId);
      if (existingRoom.bannedUids && existingRoom.bannedUids.some(b => b.uid === user?.uid)) {
        socket.emit('join_error', '방장 권한에 의해 차단(영구 퇴장)되어 입장하실 수 없습니다.');
        return;
      }
      if (existingRoom.isPrivate && user?.uid !== existingRoom.creatorUid) {
        if (!password) {
          socket.emit('join_error', '비밀방입니다. 암호를 입력해주세요.');
          return;
        } else if (existingRoom.password !== password) {
          socket.emit('join_error', '비밀번호가 일치하지 않습니다.');
          return;
        }
      }
    } else {
      rooms.set(roomId, { 
        id: roomId, 
        name: roomId, 
        users: [], 
        messages: [],
        isPrivate: !!isPrivate,
        password: password || '',
        creatorUid: user?.uid || null,
        bannedUids: []
      });
      emitSafeRoomList();
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
    const roomPayload = { ...room, password: (user?.uid === room.creatorUid ? room.password : undefined), bannedUids: (user?.uid === room.creatorUid ? room.bannedUids : undefined) };
    socket.emit('room_data', roomPayload);
    
    broadcastRoomUpdate(room);
    emitSafeRoomList();
  });

  socket.on('leave_room', ({ roomId, userUid }) => {
    const room = rooms.get(roomId);
    if (room && userUid) {
      room.users = room.users.filter(u => u.uid !== userUid);
      socket.leave(roomId);
      
      broadcastRoomUpdate(room);
      emitSafeRoomList();
    }
  });

  socket.on('update_profile', ({ roomId, userUid, newDisplayName }) => {
    const room = rooms.get(roomId);
    if (room && userUid && newDisplayName) {
      let updated = false;
      const userToUpdate = room.users.find(u => u.uid === userUid);
      if (userToUpdate) {
        userToUpdate.displayName = newDisplayName;
        updated = true;
      }
      if (updated) {
        broadcastRoomUpdate(room);
      }
    }
  });

  socket.on('send_message', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (room) {
      message.readBy = [message.sender.uid];
      room.messages.push(message);
      io.to(roomId).emit('receive_message', message);
      emitSafeRoomList(); // Update message counts globally
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
        broadcastRoomUpdate(room);
      }
    }
  });

  socket.on('delete_room', ({ roomId, userUid }) => {
    const room = rooms.get(roomId);
    if (room && room.creatorUid === userUid && roomId !== 'general') {
      rooms.delete(roomId);
      io.to(roomId).emit('room_deleted');
      emitSafeRoomList();
    }
  });

  socket.on('update_password', ({ roomId, userUid, newPassword }) => {
    const room = rooms.get(roomId);
    if (room && room.creatorUid === userUid) {
      room.password = newPassword;
      socket.emit('room_data', { ...room, password: room.password });
    }
  });

  socket.on('kick_user', ({ roomId, userUid, targetUid }) => {
    const room = rooms.get(roomId);
    if (room && room.creatorUid === userUid) {
      const targetUser = room.users.find(u => u.uid === targetUid);
      if (targetUser) {
        if (!room.bannedUids) room.bannedUids = [];
        room.bannedUids.push({ uid: targetUser.uid, displayName: targetUser.displayName, photoURL: targetUser.photoURL });
        
        room.users = room.users.filter(u => u.uid !== targetUid);
        
        io.to(roomId).emit('kick_notify', targetUid);
        
        broadcastRoomUpdate(room);
        emitSafeRoomList();
      }
    }
  });

  socket.on('unban_user', ({ roomId, userUid, targetUid }) => {
    const room = rooms.get(roomId);
    if (room && room.creatorUid === userUid && room.bannedUids) {
      room.bannedUids = room.bannedUids.filter(b => b.uid !== targetUid);
      broadcastRoomUpdate(room);
    }
  });

  socket.on('get_rooms', () => {
    const roomList = Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      usersCount: r.users.length,
      isPrivate: r.isPrivate,
      messagesCount: r.messages.length
    }));
    socket.emit('room_list', roomList);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      const userIndex = room.users.findIndex(u => u.socketId === socket.id);
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        broadcastRoomUpdate(room);
      }
    }
    emitSafeRoomList();
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
