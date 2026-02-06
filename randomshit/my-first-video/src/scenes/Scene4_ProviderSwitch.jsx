import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fadeInScale } from '../animations/transitions';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { providers, models } from '../constants/providers';

export const Scene4_ProviderSwitch = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 40,
      }}
    >
      <div style={{ display: 'flex', gap: 40 }}>
        <div style={{ ...fadeInScale(frame, 0), width: 400 }}>
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3
              style={{
                fontFamily: fonts.ui,
                fontSize: 16,
                fontWeight: 600,
                color: colors.white,
                margin: '0 0 16px 0',
              }}
            >
              Providers
            </h3>
            {providers.map((provider, i) => (
              frame >= 30 + i * 5 && (
                <div
                  key={i}
                  style={{
                    ...fadeInScale(frame, 30 + i * 5),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    marginBottom: 8,
                    borderRadius: 8,
                    backgroundColor:
                      i === 0 ? `${colors.amber}20` : 'transparent',
                    border:
                      i === 0
                        ? `2px solid ${colors.amber}`
                        : `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: provider.color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 15,
                      color: colors.white,
                    }}
                  >
                    {provider.name}
                  </span>
                  {provider.installed && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 12,
                        color: colors.amber,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              )
            ))}
          </div>
        </div>

        <div style={{ ...fadeInScale(frame, 0), width: 400 }}>
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3
              style={{
                fontFamily: fonts.ui,
                fontSize: 16,
                fontWeight: 600,
                color: colors.white,
                margin: '0 0 16px 0',
              }}
            >
              Models
            </h3>
            {models.map((model, i) => (
              frame >= 30 + i * 5 && (
                <div
                  key={i}
                  style={{
                    ...fadeInScale(frame, 30 + i * 5),
                    padding: '12px 16px',
                    marginBottom: 8,
                    borderRadius: 8,
                    backgroundColor:
                      i === 0 ? `${colors.amber}20` : 'transparent',
                    border:
                      i === 0
                        ? `2px solid ${colors.amber}`
                        : `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 15,
                      color: colors.white,
                      marginBottom: 4,
                    }}
                  >
                    {model.name}
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 12,
                      color: colors.muted,
                    }}
                  >
                    {model.description}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {frame >= 100 && (
        <div
          style={{
            ...fadeInScale(frame, 100),
            fontFamily: fonts.ui,
            fontSize: 15,
            color: colors.muted,
            textAlign: 'center',
          }}
        >
          Claude Code + OpenCode SDK — 20+ providers · Open Source models
        </div>
      )}
    </AbsoluteFill>
  );
};

export default Scene4_ProviderSwitch;
