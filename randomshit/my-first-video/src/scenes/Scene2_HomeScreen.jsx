import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AppWindow } from '../components/AppWindow';
import { Badge } from '../components/Badge';
import { fadeInScale } from '../animations/transitions';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export const Scene2_HomeScreen = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppWindow width={800} height={550}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 40,
          }}
        >
          <div style={{ ...fadeInScale(frame, 0), marginBottom: 16 }}>
            <h1
              style={{
                fontFamily: fonts.brand,
                fontSize: 48,
                color: colors.white,
                margin: 0,
                fontWeight: 400,
              }}
            >
              OpenClawd
            </h1>
          </div>

          <div style={{ ...fadeInScale(frame, 10), marginBottom: 40 }}>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 18,
                color: colors.muted,
                margin: 0,
              }}
            >
              Open Source Alternative to Claude Cowork
            </p>
          </div>

          <div
            style={{
              ...fadeInScale(frame, 20),
              width: '100%',
              maxWidth: 500,
              marginBottom: 20,
            }}
          >
            <input
              type="text"
              placeholder="Type a message..."
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: 16,
                fontFamily: fonts.ui,
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                color: colors.white,
                outline: 'none',
              }}
              readOnly
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              fontFamily: fonts.ui,
            }}
          >
            <div style={fadeInScale(frame, 30)}>
              <Badge color={colors.amber} size="md">
                Claude Code
              </Badge>
            </div>
            <div style={fadeInScale(frame, 36)}>
              <Badge color={colors.amber} size="md">
                Opus 4.6
              </Badge>
            </div>
            <div style={fadeInScale(frame, 42)}>
              <button
                style={{
                  padding: '6px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: fonts.ui,
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 999,
                  color: colors.white,
                  cursor: 'pointer',
                }}
              >
                Attach
              </button>
            </div>
          </div>
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
};

export default Scene2_HomeScreen;
