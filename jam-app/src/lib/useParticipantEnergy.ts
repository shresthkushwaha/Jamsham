'use client';
import { useEffect, useRef, useState } from 'react';

interface EnergyOptions {
  minSize?: number;
  maxSize?: number;
  decayRate?: number;
}

export function useParticipantEnergy(
  activeNotes: string[] = [],
  options: EnergyOptions = {}
) {
  const { minSize = 150, maxSize = 340, decayRate = 0.012 } = options;
  const energyRef = useRef(0);
  const [size, setSize] = useState(minSize);
  const prevNotesCountRef = useRef(0);

  useEffect(() => {
    if (activeNotes.length > prevNotesCountRef.current) {
      const added = activeNotes.length - prevNotesCountRef.current;
      // Boost energy when notes are triggered
      energyRef.current = Math.min(1.0, energyRef.current + added * 0.28);
    }
    prevNotesCountRef.current = activeNotes.length;
  }, [activeNotes]);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      // Natural exponential decay
      energyRef.current = Math.max(0, energyRef.current - decayRate);

      // Target diameter calculation
      const targetSize = minSize + energyRef.current * (maxSize - minSize);

      setSize((prev) => {
        // Smooth lerp interpolation
        return prev + (targetSize - prev) * 0.12;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [minSize, maxSize, decayRate]);

  return {
    energy: energyRef.current,
    size: Math.round(size),
    isHittingNote: activeNotes.length > 0,
  };
}
