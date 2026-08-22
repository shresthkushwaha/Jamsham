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
  { id: 'DRUM', name: 'Drum Kit', color: '#FF5722', role: 'Rhythm & Beats' },
  { id: 'GUITAR', name: 'Guitar', color: '#E040FB', role: 'Strumming & Chords' },
  { id: 'KEYBOARD', name: 'Keyboard', color: '#00E676', role: 'Melody & Harmony' },
  { id: 'TRUMPET', name: 'Trumpet', color: '#FFD600', role: 'Brass & Solo' },
];

// Room state storage: roomId -> { id, bpm, isPlaying, assignmentMode, users: { [socketId]: userObj } }
const rooms = new Map();

function getOrCreateRoom(roomId, assignmentMode = 'random') {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      bpm: 120,
      isPlaying: true,
      assignmentMode: assignmentMode || 'random',
      users: {},
    });
  }
  return rooms.get(roomId);
}

function assignInstrument(room) {
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

// HTTP API for room info query
app.get('/room-info/:roomId', (req, res) => {
  const cleanRoomId = (req.params.roomId || '').trim().toLowerCase();
  const room = rooms.get(cleanRoomId);
  if (!room) {
    return res.json({ exists: false, allInstruments: ALL_INSTRUMENTS });
  }

  const assigned = new Set(Object.values(room.users).map((u) => u.instrument?.id));
  const availableInstruments = ALL_INSTRUMENTS.filter((inst) => !assigned.has(inst.id));

  res.json({
    exists: true,
    assignmentMode: room.assignmentMode || 'random',
    availableInstruments,
    allInstruments: ALL_INSTRUMENTS,
    usersCount: Object.keys(room.users).length,
  });
});

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);
  let currentRoomId = null;

  // Query Room Info
  socket.on('get_room_info', ({ roomId }, callback) => {
    const cleanRoomId = (roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) {
      if (callback) callback({ exists: false, allInstruments: ALL_INSTRUMENTS });
      return;
    }
    const assigned = new Set(Object.values(room.users).map((u) => u.instrument?.id));
    const availableInstruments = ALL_INSTRUMENTS.filter((inst) => !assigned.has(inst.id));
    if (callback) {
      callback({
        exists: true,
        assignmentMode: room.assignmentMode || 'random',
        availableInstruments,
        allInstruments: ALL_INSTRUMENTS,
        usersCount: Object.keys(room.users).length,
      });
    }
  });

  socket.on('join_room', ({ roomId, userName, preferredInstrument, assignmentMode }, callback) => {
    const cleanRoomId = (roomId || 'main-stage').trim().toLowerCase();
    currentRoomId = cleanRoomId;
    socket.join(cleanRoomId);

    const room = getOrCreateRoom(cleanRoomId, assignmentMode);
    if (assignmentMode) {
      room.assignmentMode = assignmentMode;
    }

    let instrument;
    if (preferredInstrument) {
      const match = ALL_INSTRUMENTS.find(
        (inst) =>
          inst.id.toUpperCase() === preferredInstrument.toUpperCase() ||
          inst.name.toUpperCase().includes(preferredInstrument.toUpperCase())
      );
      if (match) {
        instrument = match;
      }
    }

    if (!instrument) {
      instrument = assignInstrument(room);
    }

    const user = {
      socketId: socket.id,
      userName: userName || `Jammer-${socket.id.slice(0, 4)}`,
      instrument,
      isMuted: false,
      isVideoOff: false,
      joinedAt: Date.now(),
    };

    room.users[socket.id] = user;

    console.log(`[User Joined] ${user.userName} (${user.instrument.name}) in room: ${cleanRoomId} [Mode: ${room.assignmentMode}]`);

    // Notify all existing users in the room that a new peer arrived
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
          bpm: room.bpm,
          isPlaying: room.isPlaying,
          assignmentMode: room.assignmentMode,
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

  // BPM / Metronome sync
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

  // Handle Disconnect
  const handleLeave = () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room && room.users[socket.id]) {
      const departedUser = room.users[socket.id];
      delete room.users[socket.id];
      console.log(`[User Left] ${departedUser.userName} from ${currentRoomId}`);

      socket.to(currentRoomId).emit('user_left', {
        socketId: socket.id,
        userName: departedUser.userName,
        remainingUsers: Object.values(room.users),
      });

      // Clean up empty room
      if (Object.keys(room.users).length === 0) {
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
