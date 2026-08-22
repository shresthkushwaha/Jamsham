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
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
}

// Compute dynamic baseline radius and expansion strictly bounded to viewport
function getBaseRadiusForCount(count: number, containerWidth: number, containerHeight: number) {
  const w = containerWidth || 900;
  const h = containerHeight || 520;
  const minDim = Math.min(w, h);

  if (count <= 1) {
    // 1 Player: Big hero orb in center
    const base = Math.max(75, Math.min(170, minDim * 0.32));
    return { baseRadius: base, maxExpansion: base * 0.22 };
  } else if (count === 2) {
    // 2 Players: Two prominent side-by-side orbs
    const maxAllowed = Math.min(w * 0.20, h * 0.32, 130);
    const base = Math.max(60, maxAllowed);
    return { baseRadius: base, maxExpansion: base * 0.20 };
  } else if (count === 3) {
    // 3 Players: Prominent trio cluster
    const maxAllowed = Math.min(w * 0.16, h * 0.24, 105);
    const base = Math.max(50, maxAllowed);
    return { baseRadius: base, maxExpansion: base * 0.18 };
  } else if (count === 4) {
    // 4 Players: Balanced 4-way cluster
    const maxAllowed = Math.min(w * 0.14, h * 0.20, 88);
    const base = Math.max(44, maxAllowed);
    return { baseRadius: base, maxExpansion: base * 0.16 };
  } else {
    // 5+ Players: Ring orbit
    const maxAllowed = Math.min(w * 0.11, h * 0.16, 70);
    const base = Math.max(36, maxAllowed);
    return { baseRadius: base, maxExpansion: base * 0.14 };
  }
}

// Calculate target anchor position strictly within center bounds
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
    const spacing = Math.min(w * 0.24, baseRadius + gap * 0.8);
    return {
      targetX: index === 0 ? cx - spacing : cx + spacing,
      targetY: cy,
    };
  }

  if (count === 3) {
    const R = Math.min(Math.min(w, h) * 0.28, baseRadius * 1.1 + gap);
    const angle = (index * 2 * Math.PI) / 3 - Math.PI / 2;
    return {
      targetX: cx + R * Math.cos(angle),
      targetY: cy + R * Math.sin(angle),
    };
  }

  if (count === 4) {
    const offX = Math.min(w * 0.22, baseRadius * 0.95 + gap * 0.5);
    const offY = Math.min(h * 0.22, baseRadius * 0.85 + gap * 0.5);
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
  const R = Math.min(Math.min(w, h) * 0.32, baseRadius * 1.35 + gap);
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
  const {
    containerWidth,
    containerHeight,
    gap = 20,
    paddingTop = 16,
    paddingBottom = 16,
    paddingX = 16,
  } = options;

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
      const role = (u.instrument?.id || 'KEYBOARD').toUpperCase();
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
      if (vol > 10) energyBump += (vol / 100) * 0.3; // Mic audio reactivity

      if (energyBump > 0) {
        energiesRef.current[u.socketId] = Math.min(1.0, (energiesRef.current[u.socketId] || 0) + energyBump);
      }
    });
  }, [users, activeNotesByUser, volumeLevels]);

  // Main 60 FPS Bounded Physics Loop
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
        const springK = nodeA.id === soloistId ? 0.055 : 0.038;
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
            const push = overlap * 0.24;

            nodeA.vx -= nx * push;
            nodeA.vy -= ny * push;
            nodeB.vx += nx * push;
            nodeB.vy += ny * push;
          }
        }

        // 3. Fluid Friction Damping
        nodeA.vx *= 0.78;
        nodeA.vy *= 0.78;

        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;

        // 4. HARD VIEWPORT BOUNDARY COLLISION CLAMPING (Never go out of screen or under header/footer)
        const minX = nodeA.radius + paddingX;
        const maxX = w - nodeA.radius - paddingX;
        const minY = nodeA.radius + paddingTop;
        const maxY = h - nodeA.radius - paddingBottom;

        if (minX <= maxX) {
          if (nodeA.x < minX) {
            nodeA.x = minX;
            nodeA.vx = Math.abs(nodeA.vx) * 0.3; // Soft elastic bounce
          } else if (nodeA.x > maxX) {
            nodeA.x = maxX;
            nodeA.vx = -Math.abs(nodeA.vx) * 0.3;
          }
        } else {
          nodeA.x = w * 0.5;
        }

        if (minY <= maxY) {
          if (nodeA.y < minY) {
            nodeA.y = minY;
            nodeA.vy = Math.abs(nodeA.vy) * 0.3;
          } else if (nodeA.y > maxY) {
            nodeA.y = maxY;
            nodeA.vy = -Math.abs(nodeA.vy) * 0.3;
          }
        } else {
          nodeA.y = h * 0.5;
        }
      }

      // 5. Group Center of Mass Soft Alignment
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

      nodes.forEach((n) => {
        n.x += shiftX * 0.12;
        n.y += shiftY * 0.12;

        // Re-clamp after center shift to guarantee 100% on-screen containment
        const minX = n.radius + paddingX;
        const maxX = w - n.radius - paddingX;
        const minY = n.radius + paddingTop;
        const maxY = h - n.radius - paddingBottom;

        if (minX <= maxX) n.x = Math.max(minX, Math.min(maxX, n.x));
        if (minY <= maxY) n.y = Math.max(minY, Math.min(maxY, n.y));
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
  }, [containerWidth, containerHeight, gap, paddingTop, paddingBottom, paddingX]);

  return positions;
}
