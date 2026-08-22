const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const ALL_INSTRUMENTS = [
  { id: 'DRUMS', name: 'Acoustic Drums', color: '#FF5722', role: 'Rhythm & Beats' },
  { id: 'PIANO', name: 'Grand Piano', color: '#00E676', role: 'Melody & Harmony' },
  { id: 'BASS', name: 'Electric Bass', color: '#E040FB', role: 'Groove & Low End' },
];

// Room state storage: roomId -> { id, adminSocketId, bpm, isPlaying, users: { [socketId]: userObj } }
const rooms = new Map();

function getOrCreateRoom(roomId, creatorSocketId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      adminSocketId: creatorSocketId,
      bpm: 120,
      isPlaying: true,
      users: {},
    });
  }
  return rooms.get(roomId);
}

function assignInstrument(room, preferredInstrumentId) {
  if (preferredInstrumentId && preferredInstrumentId !== 'AUTO') {
    const match = ALL_INSTRUMENTS.find(
      (inst) => inst.id.toUpperCase() === preferredInstrumentId.toUpperCase()
    );
    if (match) return match;
  }

  const assigned = new Set(Object.values(room.users).map((u) => u.instrument?.id));
  const available = ALL_INSTRUMENTS.filter((inst) => !assigned.has(inst.id));

  if (available.length > 0) {
    // Pick random available instrument
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // If all are taken, cycle through with duplicate
  const randomIndex = Math.floor(Math.random() * ALL_INSTRUMENTS.length);
  return { ...ALL_INSTRUMENTS[randomIndex], isShared: true };
}

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);
  let currentRoomId = null;

  socket.on('join_room', ({ roomId, userName, preferredInstrumentId }, callback) => {
    const cleanRoomId = (roomId || 'main-stage').trim().toLowerCase();
    currentRoomId = cleanRoomId;
    socket.join(cleanRoomId);

    const isFirstInRoom = !rooms.has(cleanRoomId) || Object.keys(rooms.get(cleanRoomId).users).length === 0;
    const room = getOrCreateRoom(cleanRoomId, socket.id);
    const instrument = assignInstrument(room, preferredInstrumentId);

    // The person who creates / is first in the session becomes the Admin (Host)
    const isAdmin = room.adminSocketId === socket.id || isFirstInRoom;
    if (isFirstInRoom) {
      room.adminSocketId = socket.id;
    }

    const user = {
      socketId: socket.id,
      userName: userName || `Jammer-${socket.id.slice(0, 4)}`,
      instrument,
      isAdmin,
      isMuted: false,
      isVideoOff: false,
      joinedAt: Date.now(),
    };

    room.users[socket.id] = user;

    console.log(`[User Joined] ${user.userName} (${user.instrument.name}) ${isAdmin ? '[ADMIN/HOST]' : ''} in room: ${cleanRoomId}`);

    // Notify all existing users in the room that a new peer arrived (initiates WebRTC offer)
    socket.to(cleanRoomId).emit('user_joined', {
      user,
      allUsers: Object.values(room.users),
    });

    if (callback) {
      callback({
        success: true,
        user,
        room: {
          id: room.id,
          adminSocketId: room.adminSocketId,
          bpm: room.bpm,
          isPlaying: room.isPlaying,
          users: Object.values(room.users),
        },
      });
    }
  });

  // Real-time note playback events (ultra low latency relay)
  socket.on('note_play', (data) => {
    if (!currentRoomId) return;
    // Broadcast immediately to everyone else in the room
    socket.to(currentRoomId).emit('note_play', {
      ...data,
      fromSocketId: socket.id,
      timestamp: Date.now(),
    });
  });

  socket.on('note_stop', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('note_stop', {
      ...data,
      fromSocketId: socket.id,
      timestamp: Date.now(),
    });
  });

  // WebRTC Mesh Signaling
  socket.on('webrtc_signal', ({ targetSocketId, signalType, data }) => {
    if (!targetSocketId) return;
    io.to(targetSocketId).emit('webrtc_signal', {
      fromSocketId: socket.id,
      signalType, // 'offer' | 'answer' | 'ice-candidate'
      data,
    });
  });

  // Audio/Video mute status toggle
  socket.on('update_media_state', ({ isMuted, isVideoOff }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room && room.users[socket.id]) {
      room.users[socket.id].isMuted = !!isMuted;
      room.users[socket.id].isVideoOff = !!isVideoOff;
      io.to(currentRoomId).emit('user_media_updated', {
        socketId: socket.id,
        isMuted: !!isMuted,
        isVideoOff: !!isVideoOff,
      });
    }
  });

  // BPM / Metronome sync (Admin or any participant)
  socket.on('update_bpm', ({ bpm }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room && bpm >= 40 && bpm <= 240) {
      room.bpm = bpm;
      io.to(currentRoomId).emit('bpm_updated', { bpm });
    }
  });

  // Chat message relay
  socket.on('send_chat', ({ text, userName }) => {
    if (!currentRoomId || !text) return;
    io.to(currentRoomId).emit('chat_message', {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      socketId: socket.id,
      userName: userName || 'Musician',
      text: text.trim(),
      timestamp: Date.now(),
    });
  });

  // Handle Disconnect & Host Transfer
  const handleLeave = () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room && room.users[socket.id]) {
      const departedUser = room.users[socket.id];
      delete room.users[socket.id];
      console.log(`[User Left] ${departedUser.userName} from ${currentRoomId}`);

      const remainingUsers = Object.values(room.users);

      // If the Admin/Host leaves, seamlessly promote the next participant to Admin
      if (departedUser.isAdmin && remainingUsers.length > 0) {
        remainingUsers[0].isAdmin = true;
        room.adminSocketId = remainingUsers[0].socketId;
        console.log(`[Admin Transferred] New host: ${remainingUsers[0].userName}`);
      }

      socket.to(currentRoomId).emit('user_left', {
        socketId: socket.id,
        userName: departedUser.userName,
        remainingUsers,
        adminSocketId: room.adminSocketId,
      });

      // Clean up empty room
      if (remainingUsers.length === 0) {
        rooms.delete(currentRoomId);
        console.log(`[Room Closed] ${currentRoomId}`);
      }
    }
  };

  socket.on('leave_room', handleLeave);
  socket.on('disconnect', handleLeave);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`>>> Jam Server is listening on http://localhost:${PORT}`);
});
