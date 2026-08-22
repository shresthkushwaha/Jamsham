'use client';
import { useEffect, useRef, useState } from 'react';
import { User } from '@/lib/webrtcManager';

export interface PhysicsNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  role: string;
  energy: number;
  index: number;
}

interface PhysicsOptions {
  containerWidth: number;
  containerHeight: number;
  gap?: number;
}

// Compute dynamic baseline radius and expansion based on number of participants
function getBaseRadiusForCount(count: number, containerWidth: number, containerHeight: number) {
  const minDim = Math.min(containerWidth, containerHeight);

  if (count <= 1) {
    // 1 Player: Big dominant hero orb in center (~340px - 380px diameter)
    const base = Math.max(150, Math.min(190, minDim * 0.36));
    return { baseRadius: base, maxExpansion: 55 };
  } else if (count === 2) {
    // 2 Players: Two big prominent side-by-side orbs (~270px - 300px diameter)
    const base = Math.max(125, Math.min(155, minDim * 0.30));
    return { baseRadius: base, maxExpansion: 45 };
  } else if (count === 3) {
    // 3 Players: Prominent trio cluster (~220px - 250px diameter)
    const base = Math.max(100, Math.min(125, minDim * 0.24));
    return { baseRadius: base, maxExpansion: 38 };
  } else if (count === 4) {
    // 4 Players: Balanced 4-way cluster (~180px - 210px diameter)
    const base = Math.max(85, Math.min(105, minDim * 0.20));
    return { baseRadius: base, maxExpansion: 34 };
  } else {
    // 5+ Players (~140px - 170px diameter)
    const base = Math.max(70, Math.min(90, minDim * 0.17));
    return { baseRadius: base, maxExpansion: 28 };
  }
}

// Calculate exact pixel target anchor centered horizontally and vertically
function getTargetPixelPosition(
  index: number,
  count: number,
  w: number,
  h: number,
  baseRadius: number,
  gap: number
): { targetX: number; targetY: number } {
  const cx = w * 0.5;
  const cy = h * 0.5;

  if (count <= 1) {
    return { targetX: cx, targetY: cy };
  }

  if (count === 2) {
    const spacing = baseRadius + gap * 0.6;
    return {
      targetX: index === 0 ? cx - spacing : cx + spacing,
      targetY: cy,
    };
  }

  if (count === 3) {
    const R = baseRadius * 1.15 + gap;
    const angle = (index * 2 * Math.PI) / 3 - Math.PI / 2;
    return {
      targetX: cx + R * Math.cos(angle),
      targetY: cy + R * Math.sin(angle),
    };
  }

  if (count === 4) {
    const offX = baseRadius + gap * 0.5;
    const offY = baseRadius * 0.85 + gap * 0.5;
    const offsets = [
      { x: -offX, y: -offY }, // Top-Left
      { x: offX, y: -offY },  // Top-Right
      { x: -offX, y: offY },  // Bottom-Left
      { x: offX, y: offY },   // Bottom-Right
    ];
    const off = offsets[index % 4];
    return { targetX: cx + off.x, targetY: cy + off.y };
  }

  // 5+ participants: Evenly distributed orbit
  const R = baseRadius * 1.45 + gap * 1.2;
  const angle = (index * 2 * Math.PI) / count - Math.PI / 2;
  return {
    targetX: cx + R * Math.cos(angle),
    targetY: cy + R * Math.sin(angle),
  };
}

export function useBubblePhysics(
  users: User[],
  activeNotesByUser: Record<string, string[]>,
  volumeLevels: Record<string, number> = {},
  options: PhysicsOptions
) {
  const { containerWidth, containerHeight, gap = 24 } = options;
  const nodesRef = useRef<Map<string, PhysicsNode>>(new Map());
  const [positions, setPositions] = useState<Record<string, { x: number; y: number; radius: number }>>({});
  const energiesRef = useRef<Record<string, number>>({});

  // Sync users into physics nodes
  useEffect(() => {
    const currentMap = nodesRef.current;
    const activeIds = new Set(users.map((u) => u.socketId));

    // Remove obsolete nodes
    currentMap.forEach((_, id) => {
      if (!activeIds.has(id)) currentMap.delete(id);
    });

    const count = users.length;
    const w = containerWidth || 900;
    const h = containerHeight || 520;
    const { baseRadius } = getBaseRadiusForCount(count, w, h);

    // Add / update nodes
    users.forEach((u, index) => {
      const role = (u.instrument?.id || 'PIANO').toUpperCase();
      const { targetX, targetY } = getTargetPixelPosition(index, count, w, h, baseRadius, gap);

      if (!currentMap.has(u.socketId)) {
        currentMap.set(u.socketId, {
          id: u.socketId,
          x: targetX,
          y: targetY,
          vx: 0,
          vy: 0,
          radius: baseRadius,
          targetRadius: baseRadius,
          role,
          energy: 0,
          index,
        });
      } else {
        const node = currentMap.get(u.socketId)!;
        node.index = index;
      }
    });
  }, [users, containerWidth, containerHeight, gap]);

  // Track both Note Trigger Energy & Live Microphone Voice Volume
  useEffect(() => {
    users.forEach((u) => {
      const activeNotes = activeNotesByUser[u.socketId] || [];
      const vol = volumeLevels[u.socketId] || 0;

      let energyBump = 0;
      if (activeNotes.length > 0) energyBump += 0.35;
      if (vol > 10) energyBump += (vol / 100) * 0.3; // Mic audio reactivity!

      if (energyBump > 0) {
        energiesRef.current[u.socketId] = Math.min(1.0, (energiesRef.current[u.socketId] || 0) + energyBump);
      }
    });
  }, [users, activeNotesByUser, volumeLevels]);

  // Main 60 FPS Perfect-Centering Physics Loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const w = containerWidth || 900;
      const h = containerHeight || 520;
      const nodes = Array.from(nodesRef.current.values());
      const count = nodes.length;

      if (count === 0) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const { baseRadius, maxExpansion } = getBaseRadiusForCount(count, w, h);

      // Find soloist with highest audio/note energy
      let maxEnergy = 0;
      let soloistId: string | null = null;
      nodes.forEach((n) => {
        // Natural energy decay
        energiesRef.current[n.id] = Math.max(0, (energiesRef.current[n.id] || 0) - 0.014);
        n.energy = energiesRef.current[n.id] || 0;
        if (n.energy > maxEnergy && n.energy > 0.25) {
          maxEnergy = n.energy;
          soloistId = n.id;
        }

        // Dynamic Target Radius: Scales up on note hits OR speaking into mic!
        n.targetRadius = baseRadius + n.energy * maxExpansion;
        n.radius += (n.targetRadius - n.radius) * 0.12;
      });

      // 1. Apply Symmetrical Target Attraction Forces
      for (let i = 0; i < count; i++) {
        const nodeA = nodes[i];
        const { targetX, targetY } = getTargetPixelPosition(nodeA.index, count, w, h, baseRadius, gap);

        const dxHome = targetX - nodeA.x;
        const dyHome = targetY - nodeA.y;
        const springK = nodeA.id === soloistId ? 0.05 : 0.035;
        nodeA.vx += dxHome * springK;
        nodeA.vy += dyHome * springK;

        // 2. Circle-to-Circle Elastic Repulsion (Prevent overlapping)
        for (let j = i + 1; j < count; j++) {
          const nodeB = nodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = nodeA.radius + nodeB.radius + gap;

          if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            const push = overlap * 0.22;

            nodeA.vx -= nx * push;
            nodeA.vy -= ny * push;
            nodeB.vx += nx * push;
            nodeB.vy += ny * push;
          }
        }

        // 3. Fluid Friction Damping
        nodeA.vx *= 0.80;
        nodeA.vy *= 0.80;

        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;
      }

      // 4. Exact Center-of-Mass Centering Lock
      let totalX = 0;
      let totalY = 0;
      nodes.forEach((n) => {
        totalX += n.x;
        totalY += n.y;
      });
      const avgX = totalX / count;
      const avgY = totalY / count;
      const shiftX = w * 0.5 - avgX;
      const shiftY = h * 0.5 - avgY;

      // Smoothly pull group center of mass to exact stage center (50%, 50%)
      nodes.forEach((n) => {
        n.x += shiftX * 0.15;
        n.y += shiftY * 0.15;
      });

      // Export final positions
      const posMap: Record<string, { x: number; y: number; radius: number }> = {};
      nodes.forEach((n) => {
        posMap[n.id] = { x: n.x, y: n.y, radius: n.radius };
      });
      setPositions(posMap);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [containerWidth, containerHeight, gap]);

  return positions;
}
