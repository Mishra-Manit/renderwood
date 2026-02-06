import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { ParticleSystem } from '../components/ParticleSystem';
import { fadeInScale } from '../animations/transitions';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { providers } from '../constants/providers';

export const Scene7_LogoCombo = () => {
  const frame = useCurrentFrame();

  const renderIntro = () => {
    if (frame >= 60) return null;

    const lineLength = interpolate(Math.min(frame, 30), [0, 30], [0, 400]);

    return (
      <>
        <ParticleSystem
          count={40}
          behavior="converge"
          targetX={540}
          targetY={350}
          startFrame={0}
          durationFrames={50}
        />

        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.2,
          }}
        >
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={colors.border}
              strokeWidth="1"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {[0, 90, 180, 270].map((angle, i) => (
          <line
            key={i}
            x1={540}
            y1={350}
            x2={
              540 + Math.cos((angle * Math.PI) / 180) * lineLength
            }
            y2={
              350 + Math.sin((angle * Math.PI) / 180) * lineLength
            }
            stroke={colors.amber}
            strokeWidth="2"
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        ))}

        {frame >= 20 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: interpolate(Math.min(frame - 20, 20), [0, 20], [0, 200]),
              height: interpolate(Math.min(frame - 20, 20), [0, 20], [0, 200]),
              borderRadius: '50%',
              border: `2px solid ${colors.amber}`,
              opacity: interpolate(frame - 20, [0, 20], [1, 0.3]),
            }}
          />
        )}
      </>
    );
  };

  const renderTextReveal = () => {
    if (frame < 60 || frame >= 120) return null;

    const words = ['Open', 'Source', 'AI', 'Desktop'];

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {frame >= 60 && (
          <div
            style={{
              ...fadeInScale(frame, 60),
              fontFamily: fonts.ui,
              fontSize: 24,
              color: colors.amber,
              marginBottom: 20,
            }}
          >
            ✦ Introducing ✦
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 16,
            fontFamily: fonts.brand,
            fontSize: 48,
            fontWeight: 700,
            color: colors.white,
          }}
        >
          {words.map((word, i) => (
            frame >= 70 + i * 15 && (
              <span key={i} style={fadeInScale(frame, 70 + i * 15)}>
                {word}
              </span>
            )
          ))}
        </div>

        {frame >= 110 && (
          <div
            style={{
              ...fadeInScale(frame, 110),
              fontFamily: fonts.code,
              fontSize: 14,
              color: colors.dim,
              marginTop: 20,
            }}
          >
            Opus 4.6 · Sonnet 4.5 · GPT-5.3 · Gemini 3 · DeepSeek R1
          </div>
        )}
      </div>
    );
  };

  const renderProviderIcons = () => {
    if (frame < 120) return null;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 32,
          }}
        >
          {providers.map((provider, i) => (
            frame >= 120 + i * 5 && (
              <div
                key={i}
                style={{
                  ...fadeInScale(frame, 120 + i * 5),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: provider.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                />
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: colors.muted,
                  }}
                >
                  {provider.name}
                </span>
              </div>
            )
          ))}
        </div>

        {frame >= 160 && (
          <div
            style={{
              ...fadeInScale(frame, 160),
              fontFamily: fonts.ui,
              fontSize: 14,
              color: colors.muted,
              textAlign: 'center',
              maxWidth: 700,
            }}
          >
            Claude Code + OpenCode SDK · 80+ models | Desktop · Messaging · API
          </div>
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {renderIntro()}
      {renderTextReveal()}
      {renderProviderIcons()}
    </AbsoluteFill>
  );
};

export default Scene7_LogoCombo;
