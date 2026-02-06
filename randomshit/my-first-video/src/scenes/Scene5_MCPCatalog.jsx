import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { fadeInScale } from '../animations/transitions';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export const Scene5_MCPCatalog = () => {
  const frame = useCurrentFrame();

  const modalProgress = spring({
    frame: Math.max(0, frame),
    fps: 30,
    config: { damping: 100, stiffness: 200 },
  });

  const modalScale = interpolate(modalProgress, [0, 1], [0.9, 1]);

  const servers = [
    { name: 'Filesystem', icon: 'filesystem', auth: false, installed: true },
    { name: 'Git', icon: 'git', auth: false, installed: true },
    { name: 'GitHub', icon: 'github', auth: true, installed: true },
    { name: 'PostgreSQL', icon: 'postgresql', auth: true, installed: false },
    { name: 'Slack', icon: 'slack', auth: true, installed: false },
    { name: 'Puppeteer', icon: 'puppeteer', auth: false, installed: false },
  ];

  const filters = ['All', 'Core', 'Database', 'Developer', 'Communication'];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `${colors.bg}cc`,
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 800,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 32,
          opacity: interpolate(modalProgress, [0, 1], [0, 1]),
          transform: `scale(${modalScale})`,
        }}
      >
        {frame >= 20 && (
          <div style={fadeInScale(frame, 20)}>
            <h2
              style={{
                fontFamily: fonts.ui,
                fontSize: 24,
                fontWeight: 600,
                color: colors.white,
                margin: '0 0 8px 0',
              }}
            >
              MCP Server Catalog
            </h2>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 14,
                color: colors.muted,
                margin: '0 0 24px 0',
              }}
            >
              20+ servers available
            </p>
          </div>
        )}

        {frame >= 30 && (
          <div
            style={{
              ...fadeInScale(frame, 30),
              display: 'flex',
              gap: 8,
              marginBottom: 24,
            }}
          >
            {filters.map((filter, i) => (
              <button
                key={i}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: fonts.ui,
                  backgroundColor: i === 0 ? colors.amber : 'transparent',
                  border: `1px solid ${i === 0 ? colors.amber : colors.border}`,
                  borderRadius: 999,
                  color: i === 0 ? colors.bg : colors.white,
                  cursor: 'pointer',
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}
        >
          {servers.map((server, i) => (
            frame >= 40 + i * 10 && (
              <div
                key={i}
                style={{
                  ...fadeInScale(frame, 40 + i * 10),
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <Icon name={server.icon} size={32} color={colors.amber} />
                  <Badge
                    color={server.auth ? colors.amber : colors.dim}
                    size="sm"
                  >
                    {server.auth ? 'Requires Auth' : 'No Auth'}
                  </Badge>
                </div>
                <h3
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 16,
                    fontWeight: 600,
                    color: colors.white,
                    margin: '0 0 12px 0',
                  }}
                >
                  {server.name}
                </h3>
                <button
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: fonts.ui,
                    backgroundColor: server.installed
                      ? `${colors.amber}20`
                      : 'transparent',
                    border: `1px solid ${
                      server.installed ? colors.amber : colors.border
                    }`,
                    borderRadius: 6,
                    color: server.installed ? colors.amber : colors.white,
                    cursor: 'pointer',
                  }}
                >
                  {server.installed ? '✓ Installed' : 'Install'}
                </button>
              </div>
            )
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene5_MCPCatalog;
