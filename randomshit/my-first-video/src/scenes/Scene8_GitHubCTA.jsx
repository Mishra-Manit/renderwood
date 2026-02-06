import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { Icon } from '../components/Icon';
import { ParticleSystem } from '../components/ParticleSystem';
import { fadeInScale } from '../animations/transitions';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export const Scene8_GitHubCTA = () => {
  const frame = useCurrentFrame();

  const logoRotation = interpolate(
    Math.max(0, Math.min(frame - 20, 40)),
    [0, 40],
    [-180, 0]
  );

  const pulsing = Math.sin(frame * 0.1) * 0.025 + 1;

  const orbitRadius = 150;
  const starCount = 5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.1,
        }}
      >
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke={colors.border}
            strokeWidth="1"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <ParticleSystem
        count={30}
        behavior="float"
        startFrame={0}
        durationFrames={120}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          zIndex: 10,
        }}
      >
        {frame >= 0 && (
          <div
            style={{
              ...fadeInScale(frame, 0),
              fontFamily: fonts.ui,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '2px',
              color: colors.amber,
            }}
          >
            100% OPEN SOURCE
          </div>
        )}

        {frame >= 20 && (
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${logoRotation}deg)`,
              }}
            >
              <Icon name="github" size={80} color={colors.white} />
            </div>

            {frame >= 30 &&
              Array.from({ length: starCount }).map((_, i) => {
                const angle = (frame * 0.05 + i * (Math.PI * 2)) / starCount;
                const x = Math.cos(angle) * orbitRadius;
                const y = Math.sin(angle) * orbitRadius;

                const starProgress = spring({
                  frame: Math.max(0, frame - 30),
                  fps: 30,
                  config: { damping: 100, stiffness: 200 },
                });

                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      fontSize: 24,
                      opacity: starProgress,
                    }}
                  >
                    ⭐
                  </div>
                );
              })}
          </div>
        )}

        {frame >= 40 && (
          <div
            style={{
              ...fadeInScale(frame, 40),
              fontFamily: fonts.ui,
              fontSize: 36,
              fontWeight: 700,
              color: colors.white,
              transform: `scale(${pulsing})`,
            }}
          >
            Star us on GitHub
          </div>
        )}

        {frame >= 60 && (
          <div
            style={{
              ...fadeInScale(frame, 60),
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '12px 24px',
            }}
          >
            <span
              style={{
                fontFamily: fonts.code,
                fontSize: 16,
                color: colors.muted,
              }}
            >
              github.com/rohitg00/openclawd
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default Scene8_GitHubCTA;
