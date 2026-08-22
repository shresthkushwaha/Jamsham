# Jamsham v2: Dynamic Audio-Reactive Bubble Jamming Architecture

## Executive Summary & Vision
Jamsham v2 introduces a fluid, **audio-reactive circular stage ("Bubble Jam")** where participants are represented as living, breathing circular video frames. 

The core visual mechanic: **The more active notes and energy a musician plays, the larger and more dominant their circle grows on screen**, providing an intuitive, gamified, and organic visual hierarchy of who is leading the jam.

---

## 1. UI & Visual Architecture

### A. Stage Layout & Hierarchy
```
+-----------------------------------------------------------------------------------+
|  [☰] Menu                      Code: jhfrfh-1234          4 vibers                |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|            ╭───────────────────────╮         ╭────────╮         ╭────────╮        |
|          ╭─╯                       ╰─╮     ╭─╯ Horn   ╰─╮     ╭─╯ Guitar ╰─╮      |
|         │                             │   │   [RED]    │   │  [GREEN]   │     |
|         │      ACTIVE SOLOIST         │    ╰─╮      ╭──╯    ╰─╮      ╭──╯     |
|         │        (DOMINANT)           │       ╰───┬─╯          ╰───┬─╯        |
|         │                             │           │ 🎺             │ 🎸       |
|         │        [PURPLE]             │                                           |
|          ╰─╮                       ╭──╯              ╭────────╮                   |
|            ╰───────────────────┬───╯               ╭─╯  Sax   ╰─╮                 |
|                                │ 🎹               │  [YELLOW]  │                  |
|                                                    ╰─╮      ╭──╯                  |
|                                                       ╰───┬─╯                     |
|                                                           │ 🎷                    |
+-----------------------------------------------------------------------------------+
|  [ A1 ]   [ F1 ]   [ G1 ]   [ B1 ]   [ C2 ]   [ A1 ]   [ F1 ]   [ G1 ]   [ B1 ]   |
|                          (Bottom Playable Note Deck)                              |
+-----------------------------------------------------------------------------------+
```

1. **Header Bar:**
   - **Menu / Settings:** Quick access to audio/video devices, metronome, and session controls.
   - **Room Code:** One-click copy room ID (`Code- jhfrfh-1234`).
   - **Viber Counter:** Connected participant count (e.g. `4 vibers`).

2. **Central Canvas (Organic Floating Stage):**
   - **Dynamic Orbs:** Circular video feeds (`<video>` clipped in `rounded-full`) with glowing colored halos.
   - **Color Identity:**
     - 🎹 **Lead / Synth:** Neon Purple (`#9C27B0`)
     - 🎺 **Horn / Brass:** Crimson Red (`#F44336`)
     - 🎸 **Strings / Guitar:** Lime Green (`#4CAF50`)
     - 🎷 **Sax / Woodwind:** Electric Yellow (`#FFEB3B`)
     - 🥁 **Drums / Percussion:** Cyber Cyan (`#00E5FF`)
   - **Instrument Badges:** Mini circular icon badges pinned to the bottom-right of each player orb.

3. **Bottom Playable Trigger Deck:**
   - Circular trigger pads with assigned note values (`A1`, `F1`, `G1`, `B1`, `C2`, `D2`, etc.).
   - Multi-modal input: Mouse click, mobile touch, and physical keyboard hotkeys (`1-9` / `A-K`).

---

## 2. Dynamic Audio-Reactivity & Sizing Mechanics

### A. The "Note Density / Energy Accumulator" (Bubble Sizing)
The diameter of each participant's circle dynamically scales based on their **musical note output and velocity**:

$$\text{Energy}_{\text{new}} = \min(1.0, \text{Energy} + (\text{NotesPlayed} \times \text{VelocityWeight}))$$
$$\text{Energy}_{\text{current}} = \max(0.0, \text{Energy}_{\text{current}} - \text{DecayRate})$$
$$\text{Diameter} = \text{MinSize} + (\text{MaxSize} - \text{MinSize}) \times \text{Energy}_{\text{current}}$$

* **Idle / Sparse Player:** `130px - 150px` (Ambient background size).
* **Steady Rhythm / Chords:** `200px - 250px` (Medium presence).
* **Active Soloist / Fast Riffs:** `320px - 380px` (Dominates screen center).

### B. Audio Reactivity (Glow, Pulse & Auras)
* **Voice Activity (WebRTC `AnalyserNode`):** Real-time RMS decibel detection expands the soft outer box-shadow / halo.
* **Note Hit Shockwave:** Instant transient pop (`transform: scale(1.08)`) and badge flash whenever a Tone.js note is struck.
* **Decay Physics:** 60fps `requestAnimationFrame` interpolation (lerp) ensures organic breathing movement without abrupt jumps.

---

## 3. Technology Stack & Architecture

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 14 (React) + TailwindCSS / Lucide | Component structure, responsive canvas, animations |
| **Audio Engine** | Tone.js + Web Audio API | Low-latency local synthesis, polyphonic synths, drum samplers |
| **Real-time Signaling** | Socket.io (Node.js) | Note On/Off broadcasting, velocity sync, room presence |
| **Video & Voice** | WebRTC (Mesh / SFU) | Low-latency peer-to-peer audio & video communication |
| **Audio Analysis** | Web Audio `AnalyserNode` | Real-time frequency & volume data for reactive borders |
| **Recording & Export** | `MediaRecorder` API | Mixed stream destination capturing WebRTC audio + Tone.js master |

---

## 4. Component Structure

```
jam-app/src/
├── components/
│   ├── stage/
│   │   ├── BubbleStage.tsx          # Canvas containing all floating player orbs
│   │   ├── PlayerOrb.tsx            # Audio-reactive circular video frame & badge
│   │   └── NoteTriggerDeck.tsx      # Bottom circular note pad strip (A1, F1, G1...)
│   ├── audio/
│   │   ├── ToneEngine.ts            # Central Tone.js synthesizer & sound bank
│   │   └── useAudioLevel.ts         # Hook for WebRTC stream RMS volume analysis
│   ├── hooks/
│   │   └── useParticipantEnergy.ts  # Note density decay & dynamic sizing hook
│   └── Header/
│       └── StageHeader.tsx          # Room code, viber counter, session settings
```

---

## 5. Implementation Roadmap

### Phase 1: Audio-Reactive Circular Orbs (`PlayerOrb.tsx`)
- [ ] Implement circular video element with `object-fit: cover` and mirrored orientation.
- [ ] Connect `useAudioLevel` hook for live microphone RMS glow reactivity.
- [ ] Implement `useParticipantEnergy` for dynamic size scaling ($140\text{px} \to 360\text{px}$) on note hits.
- [ ] Add corner instrument badge with pop animation on note trigger.

### Phase 2: Bottom Note Trigger Deck (`NoteTriggerDeck.tsx`)
- [ ] Render horizontal strip of circular note buttons (`A1`, `F1`, `G1`, `B1`, `C2`, etc.).
- [ ] Map click, touch, and physical keyboard keys to trigger instant local Tone.js notes.
- [ ] Emit socket `note_on` and `note_off` events with velocity.

### Phase 3: Stage Physics & Multi-user Layout (`BubbleStage.tsx`)
- [ ] Implement responsive stage layout where bubbles expand/shrink smoothly with CSS grid/flex or soft physics.
- [ ] Support up to 4–6 concurrent vibers with dedicated instrument color schemes.
- [ ] Synchronize remote note triggers to light up and inflate peer orbs in real time.

### Phase 4: Recording & Session Polish
- [ ] Single-click session recording combining WebRTC microphone feeds and Tone.js master track.
- [ ] Visual metronome pulse indicator in the header.
- [ ] Performance testing to ensure steady 60 FPS animation during intense note bursts.
