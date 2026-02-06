import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { fadeInScale } from '../animations/transitions';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export const Scene6_MessagingBots = () => {
  const frame = useCurrentFrame();

  const platforms = [
    { name: 'WhatsApp', icon: 'whatsapp', features: ['Memory', 'Tools'] },
    { name: 'Telegram', icon: 'telegram', features: ['Scheduling', 'Memory'] },
    { name: 'Signal', icon: 'signal', features: ['Tools'] },
    { name: 'iMessage', icon: 'imessage', features: ['Memory', 'Scheduling'] },
  ];

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
      {frame >= 0 && (
        <div style={{ ...fadeInScale(frame, 0), textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: fonts.ui,
              fontSize: 40,
              fontWeight: 700,
              color: colors.white,
              margin: '0 0 12px 0',
            }}
          >
            Your AI, everywhere you chat
          </h1>
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 16,
              color: colors.muted,
              margin: 0,
            }}
          >
            Full tool access · Memory · Scheduling
          </p>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
          maxWidth: 600,
        }}
      >
        {platforms.map((platform, i) => {
          const cardProgress = spring({
            frame: Math.max(0, frame - (30 + i * 15)),
            fps: 30,
            config: { damping: 100, stiffness: 200 },
          });

          const scale = interpolate(cardProgress, [0, 1], [0, 1]);
          const opacity = interpolate(cardProgress, [0, 1], [0, 1]);

          return (
            frame >= 30 + i * 15 && (
              <div
                key={i}
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 24,
                  width: 200,
                  textAlign: 'center',
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Icon name={platform.icon} size={48} color={colors.amber} />
                </div>
                <h3
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 18,
                    fontWeight: 600,
                    color: colors.white,
                    margin: '0 0 8px 0',
                  }}
                >
                  {platform.name}
                </h3>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: fonts.ui,
                    backgroundColor: `${colors.amber}20`,
                    border: `1px solid ${colors.amber}40`,
                    borderRadius: 999,
                    color: colors.amber,
                    marginBottom: 12,
                  }}
                >
                  Connected
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {platform.features.map((feature, j) => (
                    <Badge key={j} color={colors.dim} size="sm">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default Scene6_MessagingBots;
