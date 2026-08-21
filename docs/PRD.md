# Product Requirements Document (PRD): Jamsham Studio

**Document Version:** 1.0.0  
**Project:** Jamsham - Real-Time Collaborative Web Jamming Platform  
**Target Platform:** Modern Web Browsers (Next.js, Tone.js, WebRTC, Socket.io)  
**Status:** In Active Development  

---

## 1. Executive Summary & Product Vision

**Jamsham** is a low-latency, real-time collaborative web platform designed for musicians and hobbyists to join virtual jam rooms, receive or select instrument roles, and play music synchronously while interacting via video and voice chat.

By uniting **browser-side Tone.js synthesis (0ms local audio latency)** with **quantized beat synchronization** and **WebRTC audio/video communication**, Jamsham solves the fundamental internet physics challenge of remote musical collaboration.

---

## 2. Target Audience & User Personas

1. **Remote Bandmates & Collaborators:** Musicians in different locations looking for instant, setup-free rehearsal and song ideation.
2. **Casual Jam Enthusiasts & Hobbyists:** Users who want to drop into a room, tap keys/pads or strum strings with zero musical friction.
3. **Fusion & World Music Artists:** Musicians seeking a platform supporting both contemporary instruments (Drums, Guitar, Keyboard) and traditional acoustic instruments (Indian Classical Sitar & Tanpura).
4. **Music Producers & Creators:** Beatmakers wishing to record live synchronized jam sessions with downloadable multi-track or stereo audio.

---

## 3. Core Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                  │
│  Next.js 16 (React 19) • Tone.js (Web Audio API) • DialKit • CSS Glass │
└──────────────────┬───────────────────────────────┬─────────────────────┘
                   │                               │
                   ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐
       │   REAL-TIME SYNC      │       │     VOICE & VIDEO     │
       │ Socket.io (Node.js)   │       │   WebRTC / LiveKit    │
       │ Note Telemetry Events │       │ P2P Audio/Video Mesh  │
       └───────────────────────┘       └───────────────────────┘
```

| Layer | Technology | Primary Function |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (App Router, React 19)** | High-performance SPA interface, component state, and UI rendering. |
| **Audio Synthesis Engine** | **Tone.js & Web Audio API** | Instant zero-latency synthesis, filter effects, and local master routing. |
| **Interactive Controls** | **DialKit & Motion** | High-precision control surfaces, slider dials, and hardware spring motion. |
| **Real-time Event Sync** | **Socket.io** | Lightweight JSON note triggers (`{ inst, note, time, velocity }`). |
| **Voice & Video Chat** | **WebRTC (LiveKit)** | Low-latency multi-stream camera feeds and band voice communication. |
| **Session Recording** | **MediaRecorder API** | Captures master Tone.js audio + WebRTC feeds into `.webm` / `.wav`. |

---

## 4. Latency Management Strategy

1. **Instant Local Playback (0ms):**
   - The user pressing a key or pad hears the note rendered immediately by local Web Audio synthesizers with no perceived lag.
2. **Quantized Network Grid Approach:**
   - Network transmission experiences jitter and 20–80ms ping. To ensure musical cohesion, remote incoming events are snapped to the next musical quantization subdivision (1/16th or 1/8th note grid on a shared 120 BPM clock).
3. **Tanpura Drone Continuous Anchor:**
   - For modal and raga-based improvisation, a continuous harmonic drone provides an immutable pitch anchor regardless of network variance.

---

## 5. Screen Layout & Structural Specifications (Variation 3)

The interface follows a **Hardware Studio Console** layout:

```
┌──────┬──────────────────────────────────────────────────────────┬──────┐
│      │                  TOP HEADER STATUS BAR                   │ [⚙]  │
│      ├──────────────────────────────────────────────────────────┴──────┤
│  L   │                                                                 │
│  E   │                2×2 COLLABORATIVE BAND STAGE                     │
│  F   │                                                                 │
│  T   │   [ Card 1: Host (You) ]          [ Card 2: Sarah (Guitar) ]    │
│      │   [ Card 3: Mike (Keyboard) ]     [ Card 4: Aarav (Sitar) ]     │
│  S   │                                                                 │
│  I   ├──────────────────────────────────────────────────┬──────────────┤
│  D   │       TACTILE HARDWARE INSTRUMENT PANEL          │ 3 CTAS:      │
│  E   │   (Wide Left Panel: Pads, Keys, Strings, Frets)  │ [🎙] [🎛] [⚙]  │
│  B   │   • Controlled by Hover/Strum & Keypads          │ MIC  FILT SET│
└──────┴──────────────────────────────────────────────────┴──────────────┘
```

---

## 6. Detailed Feature Breakdown

### 6.1. Top Header Component (`Header.tsx`)
- **Room Identity Badge:** Displays current active room (e.g., `ROOM: JAZZ-CAFE-123`) with live session status indicator and one-click link sharing.
- **Quantized Metronome & BPM Controller:**
  - Interactive BPM tempo adjuster (`-` / `+` / direct numeric input, range 40–240 BPM).
  - 4-Beat visual pulse indicator showing downbeats and subdivisions in real-time.
  - Synced audio click toggle for audible timing reference.
- **Session Recording Pill:**
  - Real-time `REC: [ MM:SS ]` counter with glowing pulse animation.
  - One-click Start/Stop recording toggle routed to browser MediaStreamDestination.
- **Header Settings Trigger:** Quick-access modal launcher for device configurations.

---

### 6.2. Full-Height Left Sidebar (`Sidebar.tsx`)
- **`🎛 MIX` (Master Mixer):** Master output volume fader (-30dB to +6dB) and per-channel volume sliders for Drums, Guitar, Keyboard, and Sitar.
- **`🎵 INST` (Role Switcher):** Instant role switcher allowing the player to swap active control between all 4 supported instruments.
- **`💬 CHAT` (Session Chat):** Unread counter badge and slide-over real-time text chat drawer for musical cues and messages.
- **`👥 BAND` (Band Member Roster):** Displays all 4 room participants, assigned instrument, connection ping (e.g., `12ms`), and host privileges.
- **`❓ HELP` (Hotkey Reference):** Quick modal detailing all keyboard hotkeys and hover strumming controls.

---

### 6.3. 2×2 Collaborative Band Stage (`PlayerCard.tsx`)
Four dedicated symmetric cards representing the 4-player band:

1. **Player 1 (Host / You):**
   - **Auto-Starting Webcam:** Auto-requests local camera stream upon joining with active video display.
   - **Fallback Visualizer:** If camera is inactive or blocked, renders a dynamic Canvas equalizer with real-time studio lighting and particle glow.
   - **Manual Cam Toggle:** Toggle button (`🟢 Cam Active` / `📷 Turn On Cam`) directly on the card.
2. **Player 2 (Sarah - 🎸 Electric Guitar):** Live stream, active chord triggers, and reactive audio VU meter.
3. **Player 3 (Mike - 🎹 Synth Keyboard):** Live stream, polyphonic key glow, and reactive audio VU meter.
4. **Player 4 (Aarav - 🪕 Indian Sitar & Tanpura):** Live stream, Swara note highlights, and harmonic drone visualizer.

#### Audio-Visual Reactive Elements on Every Card:
- **12-Segment Color-Coded VU Meter:** Real-time signal level monitoring (Green -24dB to -6dB, Amber -6dB to 0dB, Red Clipping).
- **Active Note Trigger Badge:** Displays the exact note or chord currently sounding (e.g., `Kick • Snare`, `E Minor Chord`, `C4 • G4`, `Sa (C4)`).
- **Mic Mute Indicator:** Clear `🔇 MUTED` badge when microphone is muted.

---

### 6.4. Tactile Hardware Instrument Panel (`InstrumentPanel.tsx`)
Height expanded (`215px`) for a realistic studio console feel with **dual control modes**:
- **🖐 Hover & Strumming Mode:** Glide cursor over strings, frets, or pads to strum/trigger notes instantly.
- **⌨ Keypad & QWERTY Hotkeys:** Physical keycaps labeled for rapid keyboard control.

#### Supported Instruments:

#### 1. 🥁 Drums (Akai MPC Style 8-Pad Drum Machine)
- **Pads:** `KICK 808`, `PUNCH SNARE`, `CLOSED HAT`, `OPEN HAT`, `HI TOM`, `LOW TOM`, `CRASH CYMBAL`, `STUDIO CLAP`.
- **Controls:** Velocity slider (20%–100%), LED hit indicators.
- **Keypad Mapping:** `[1 - 4]`, `[Q, W, E, R]`, and Numpad `[1 - 8]`.

#### 2. 🎸 Guitar (Electric & Acoustic Strummer)
- **Quick Chord Buttons (6 Strummers):** `[Em]`, `[G]`, `[C]`, `[D]`, `[Am]`, `[F]` with staggered realistic strum timing (25ms string delay).
- **Strummable Fretboard:** 6 vibrating physical string lanes (`E2, A2, D3, G3, B3, E4`) with realistic gauge thickness and hover strumming.
- **Keypad Mapping:** `[1 - 6]` for chords, `[Q - Y]` for individual strings.

#### 3. 🎹 Keyboard (Polyphonic Studio Piano)
- **Keys:** Full octave Ivory & Ebony piano keys spanning `C4` to `C5` (White keys: C, D, E, F, G, A, B, C; Black keys: C#, D#, F#, G#, A#).
- **Controls:** Octave shift (`-2` to `+2`), polyphonic voice stacking.
- **Keypad Mapping:** `[A, W, S, E, D, F, T, G, Y, H, U, J, K]`.

#### 4. 🪕 Sitar & Tanpura (Traditional Indian Instrument)
- **Sitar Fretboard Swaras:** Classical 8-note Indian scale:
  - **Sa (C4)** – Shadja (Tonic Root)
  - **Re (D4)** – Rishabh
  - **Ga (E4)** – Gandhar
  - **Ma (F#4)** – Teevra Madhyam
  - **Pa (G4)** – Pancham
  - **Dha (A4)** – Dhaivat
  - **Ni (B4)** – Nishad
  - **Sȧ (C5)** – Tar Saptak Shadja
- **Tanpura Drone Toggle Button:** Continuous classical Indian acoustic drone on tonic *Sa-Pa* (`C3-G3-C4`) for background harmonic resonance.
- **Keypad Mapping:** `[1 - 8]` and `[A - K]`.

---

### 6.5. Bottom-Right Action Buttons (`ActionButtons.tsx`)
Three large hardware buttons matching the bottom panel height:

1. **`[🎙 MIC MUTE]` / `[MIC ACTIVE]`:**
   - Toggles local WebRTC microphone stream.
   - Status LED: Glowing Green (Active) vs Glowing Red (Muted).
   - Hotkey: `[M]`.
2. **`[🎛 PUT FILTER ON]` / `[FILTER ON]`:**
   - Toggles Tone.js 800Hz Lowpass Filter effect with dynamic resonance sweep.
   - Status LED & Border: Glowing Cyan when active.
   - Hotkey: `[F]`.
3. **`[⚙ SETTINGS]`:**
   - Launches session configuration modal.

---

### 6.6. Modals & Overlays
- **Settings Modal (`SettingsModal.tsx`):** Audio engine status, Latency Sync Mode (Quantized Grid vs Instant Raw), Quantize Subdivision (1/4, 1/8, 1/16), Microphone input select, and invite link copy.
- **Chat Drawer (`ChatDrawer.tsx`):** Real-time text messaging with timestamp and color-coded sender roles.

---

## 7. Implementation Roadmap & Status

| Phase | Milestone Description | Status |
| :--- | :--- | :--- |
| **Phase 1** | Next.js setup, Tone.js synthesis sandbox, audio components | ✅ **Completed** |
| **Phase 2** | UI Variation 3 layout (2×2 grid, Sidebar, Top header, Hardware panel, 3 CTAs) | ✅ **Completed** |
| **Phase 3** | Multi-instrument engine (Guitar, Drums, Keyboard, Indian Sitar & Tanpura Drone) | ✅ **Completed** |
| **Phase 4** | Auto-start camera feed, canvas visualizer fallback, hover & keypad controls | ✅ **Completed** |
| **Phase 5** | Socket.io backend event relay & quantized room metronome synchronization | 🔄 *Next Phase* |
| **Phase 6** | WebRTC LiveKit mesh for low-latency P2P audio/video streaming | 🔄 *Planned* |
| **Phase 7** | Full session recording to downloadable `.wav` / `.webm` format | 🔄 *Planned* |

---

## 8. Non-Functional & Performance Requirements

- **Local Latency:** < 5ms audio output response on keypress.
- **Frame Rate:** 60fps UI animations, Canvas equalizers, and DialKit transitions.
- **Browser Compatibility:** Chrome, Edge, Firefox, Safari (Web Audio API & WebRTC compliant).
- **Responsive Layout:** Optimized for minimum 1280×720 viewport up to 4K studio monitors.
