import { spring, interpolate } from 'remotion';

export const fadeInScale = (frame, startFrame = 0, fps = 30) => {
  const progress = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    transform: `scale(${interpolate(progress, [0, 1], [0.95, 1])})`,
  };
};

export const fadeOutScale = (frame, endFrame, fps = 30) => {
  const progress = spring({
    frame: Math.max(0, frame - (endFrame - 30)),
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return {
    opacity: interpolate(progress, [0, 1], [1, 0]),
    transform: `scale(${interpolate(progress, [0, 1], [1, 0.95])})`,
  };
};

export const springPresets = {
  gentle: { damping: 100, stiffness: 200 },
  bouncy: { damping: 50, stiffness: 300 },
  stiff: { damping: 200, stiffness: 500 },
};
