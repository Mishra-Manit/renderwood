import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { colors } from '../constants/colors';

export const ParticleSystem = ({
  count = 30,
  behavior = 'float',
  targetX = 0,
  targetY = 0,
  startFrame = 0,
  durationFrames = 60,
}) => {
  const frame = useCurrentFrame();

  const particles = Array.from({ length: count }, (_, i) => {
    const seed = i * 1000;
    const startX = (Math.sin(seed) * 0.5 + 0.5) * 1080;
    const startY = (Math.cos(seed) * 0.5 + 0.5) * 700;
    const size = 2 + (Math.sin(seed * 2) * 0.5 + 0.5) * 4;

    let x, y;

    if (behavior === 'converge') {
      const progress = Math.min(
        1,
        Math.max(0, (frame - startFrame) / durationFrames)
      );
      x = interpolate(progress, [0, 1], [startX, targetX]);
      y = interpolate(progress, [0, 1], [startY, targetY]);
    } else {
      const floatSpeed = 0.5 + (Math.sin(seed * 3) * 0.5 + 0.5) * 0.5;
      const floatAmplitude = 50 + (Math.sin(seed * 4) * 0.5 + 0.5) * 50;
      x = startX + Math.sin((frame - startFrame) * floatSpeed * 0.02) * floatAmplitude;
      y = startY + Math.cos((frame - startFrame) * floatSpeed * 0.015) * floatAmplitude;
    }

    return { x, y, size, opacity: 0.3 + (Math.sin(seed * 5) * 0.5 + 0.5) * 0.4 };
  });

  return (
    <>
      {particles.map((particle, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            backgroundColor: colors.amber,
            opacity: particle.opacity,
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            willChange: 'transform',
          }}
        />
      ))}
    </>
  );
};
