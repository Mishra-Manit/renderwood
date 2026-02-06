import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const MyVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Intro animation (first 30 frames)
  const introProgress = spring({
    frame: frame,
    fps,
    config: {
      damping: 100,
    },
  });

  // Outro animation (last 30 frames)
  const outroStart = durationInFrames - 30;
  const outroProgress = spring({
    frame: Math.max(0, frame - outroStart),
    fps,
    config: {
      damping: 100,
    },
  });

  // Intro: scale from 0 to 1 and fade in
  const introScale = interpolate(introProgress, [0, 1], [0, 1]);
  const introOpacity = interpolate(introProgress, [0, 1], [0, 1]);

  // Outro: scale down and fade out
  const outroScale = interpolate(
    outroProgress,
    [0, 1],
    [1, 0.8]
  );
  const outroOpacity = interpolate(
    outroProgress,
    [0, 1],
    [1, 0]
  );

  // Combine intro and outro effects
  const scale = frame < 30 ? introScale : outroScale;
  const opacity = frame < outroStart ? introOpacity : outroOpacity;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#001f3f', // Navy blue
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          transform: `scale(${scale})`,
          opacity,
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        This is my first video
      </div>
    </AbsoluteFill>
  );
};
