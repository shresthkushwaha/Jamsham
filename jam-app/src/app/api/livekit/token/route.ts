import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://jamsham-sc9cawdu.livekit.cloud';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIug6WiJ8PstJm';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'eJfuxGowbQmvVXJRXGUaX7uA63GvjLSoElFaqvxdOZy';

const INSTRUMENT_POOL = [
  { id: 'GUITAR', name: 'Guitar', color: '#FF9800', role: 'Chords & Riffs', icon: '🎸' },
  { id: 'KEYBOARD', name: 'Keyboard', color: '#00E676', role: 'Melody & Harmony', icon: '🎹' },
  { id: 'DRUM', name: 'Drum Kit', color: '#FF5722', role: 'Rhythm & Beats', icon: '🥁' },
  { id: 'SITAR', name: 'Sitar', color: '#E040FB', role: 'Classical Melodies & Ragas', icon: '🪕' },
  { id: 'FLUTE', name: 'Flute', color: '#00B0FF', role: 'Air & Woodwind Solos', icon: '🪈' },
  { id: 'TRUMPET', name: 'Trumpet', color: '#FFD600', role: 'Bright Brass & Horn Stabs', icon: '🎺' },
  { id: 'SAXOPHONE', name: 'Saxophone', color: '#AB47BC', role: 'Soulful Leads & Stabs', icon: '🎷' },
  { id: 'VIOLIN', name: 'Violin', color: '#29B6F6', role: 'Classical & Cinematic Melodies', icon: '🎻' },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, userName, isAdmin } = body;

    if (!roomId || !userName) {
      return NextResponse.json({ error: 'Missing roomId or userName' }, { status: 400 });
    }

    const participantIdentity = `${userName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Pick instrument based on random or order
    const randomInst = INSTRUMENT_POOL[Math.floor(Math.random() * INSTRUMENT_POOL.length)];

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: userName,
      metadata: JSON.stringify({
        userName,
        isAdmin: !!isAdmin,
        instrument: randomInst,
      }),
    });

    at.addGrant({
      room: roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      serverUrl: LIVEKIT_URL,
      identity: participantIdentity,
      instrument: randomInst,
    });
  } catch (err: any) {
    console.error('[LiveKit Token Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate token' }, { status: 500 });
  }
}
