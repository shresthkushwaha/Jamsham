const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Full 8-Instrument Band Showcase
const ALL_INSTRUMENTS = [
  { id: 'DRUMS', name: 'Acoustic Drums', color: '#FF5722', role: 'Rhythm & Beats' },
  { id: 'BASS', name: 'Electric Bass Guitar', color: '#E040FB', role: 'Groove & Low End' },
  { id: 'PIANO', name: 'Grand Piano', color: '#00E676', role: 'Melody & Harmony' },
  { id: 'GUITAR', name: 'Electric / Acoustic Guitar', color: '#FF9800', role: 'Chords & Riffs' },
  { id: 'SAX', name: 'Saxophone & Horns', color: '#FFD600', role: 'Soulful Leads & Stabs' },
  { id: 'STRINGS', name: 'String Section', color: '#00B0FF', role: 'Violin & Cello Swells' },
  { id: 'PAD', name: 'Ambient Synth Pad', color: '#26A69A', role: 'Atmospheric Chords' },
  { id: 'LEAD', name: 'Synth Lead & Keys', color: '#AB47BC', role: 'Electronic Melodies' },
];

// Room state storage: roomId -> { id, adminSocketId, bpm, isPlaying, users: { [socketId]: userObj } }
const rooms = new Map();

// Health check endpoint — keeps Render alive and confirms server is running
app.get('/', (req, res) => {
  const roomCount = rooms.size;
  const userCount = [...rooms.values()].reduce((sum, r) => sum + Object.keys(r.users).length, 0);
  res.json({ status: 'ok', service: 'Jamsham Jam Server', rooms: roomCount, users: userCount, instruments: ALL_INSTRUMENTS.length });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));

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

function assignInstrument(room) {
  const assigned = new Set(Object.values(room.users).map((u) => (u.instrument?.id || '').toUpperCase()));
  const available = ALL_INSTRUMENTS.filter((inst) => !assigned.has(inst.id));

  if (available.length > 0) {
    // Pick random available instrument so every player gets a unique instrument
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // If all 8 are taken, pick randomly
  const randomIndex = Math.floor(Math.random() * ALL_INSTRUMENTS.length);
  return { ...ALL_INSTRUMENTS[randomIndex], isShared: true };
}

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);
  let currentRoomId = null;

  socket.on('ping_heartbeat', () => {
    socket.emit('pong_heartbeat');
  });

  socket.on('join_room', ({ roomId, userName }, callback) => {
    const cleanRoomId = (roomId || 'main-stage').trim().toLowerCase();
    currentRoomId = cleanRoomId;
    socket.join(cleanRoomId);

    const isFirstUser = !rooms.has(cleanRoomId) || Object.keys(rooms.get(cleanRoomId).users).length === 0;
    const room = getOrCreateRoom(cleanRoomId, socket.id);
    const instrument = assignInstrument(room);

    const user = {
      socketId: socket.id,
      userName: userName || `Jammer-${socket.id.slice(0, 4)}`,
      instrument,
      isAdmin: isFirstUser || room.adminSocketId === socket.id,
      isMuted: false,
      isVideoOff: false,
      joinedAt: Date.now(),
    };

    room.users[socket.id] = user;

    console.log(`[User Joined] ${user.userName} (${user.instrument.name}) in room: ${cleanRoomId} [Total: ${Object.keys(room.users).length}]`);

    // Notify all existing users in the room that a new peer arrived (initiates WebRTC offer)
    socket.to(cleanRoomId).emit('user_joined', {
      user,
      allUsers: Object.values(room.users),
    });

    if (typeof callback === 'function') {
      callback({
        success: true,
        user,
        room: {
          id: cleanRoomId,
          bpm: room.bpm,
          isPlaying: room.isPlaying,
          users: Object.values(room.users),
        },
      });
    }
  });

  // WebRTC Signal Relay (SDP Offers, Answers, ICE Candidates)
  socket.on('webrtc_signal', ({ targetSocketId, signalType, data }) => {
    if (!targetSocketId) return;
    io.to(targetSocketId).emit('webrtc_signal', {
      fromSocketId: socket.id,
      signalType,
      data,
    });
  });

  // Real-time Tone.js Note Events
  socket.on('note_play', (event) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('note_play', {
      ...event,
      fromSocketId: socket.id,
      timestamp: Date.now(),
    });
  });

  socket.on('note_stop', (event) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('note_stop', {
      ...event,
      fromSocketId: socket.id,
      timestamp: Date.now(),
    });
  });

  // Media Mute / Video Toggle
  socket.on('update_media_state', ({ isMuted, isVideoOff }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room && room.users[socket.id]) {
      if (typeof isMuted === 'boolean') room.users[socket.id].isMuted = isMuted;
      if (typeof isVideoOff === 'boolean') room.users[socket.id].isVideoOff = isVideoOff;

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

  // Handle Disconnect & Host succession
  const handleLeave = () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room && room.users[socket.id]) {
      const departedUser = room.users[socket.id];
      delete room.users[socket.id];
      console.log(`[User Left] ${departedUser.userName} from ${currentRoomId}`);

      const remainingUsers = Object.values(room.users);

      // Auto host succession if admin leaves
      if (room.adminSocketId === socket.id && remainingUsers.length > 0) {
        room.adminSocketId = remainingUsers[0].socketId;
        remainingUsers[0].isAdmin = true;
        console.log(`[Host Succession] New Admin is ${remainingUsers[0].userName}`);
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
