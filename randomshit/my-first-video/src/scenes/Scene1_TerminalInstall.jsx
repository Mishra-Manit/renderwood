import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { AppWindow } from '../components/AppWindow';
import { TypingText } from '../components/TypingText';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export const Scene1_TerminalInstall = () => {
  const frame = useCurrentFrame();

  const terminalProgress = spring({
    frame: Math.max(0, frame),
    fps: 30,
    config: { damping: 100, stiffness: 200 },
  });

  const rotateX = interpolate(terminalProgress, [0, 1], [20, 0]);
  const translateZ = interpolate(terminalProgress, [0, 1], [-200, 0]);
  const rotateY = Math.sin(frame * 0.1) * 5;

  const serverLines = [
    { text: '✓ OpenClawd v1.0.0', frame: 70, color: colors.amber },
    { text: '✓ OpenCode SDK initialized', frame: 75, color: colors.white },
    { text: '✓ 20+ providers available', frame: 80, color: colors.white },
    { text: '  - Claude Code', frame: 85, color: colors.muted },
    { text: '  - OpenAI', frame: 88, color: colors.muted },
    { text: '  - Gemini', frame: 91, color: colors.muted },
    { text: '  - DeepSeek', frame: 94, color: colors.muted },
    { text: '  - Llama 4', frame: 97, color: colors.muted },
    { text: '✓ 80+ models loaded', frame: 100, color: colors.white },
    { text: '✓ MCP servers ready', frame: 103, color: colors.white },
    { text: '✓ Server listening on :3001', frame: 106, color: colors.amber },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1000,
      }}
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <AppWindow width={700} height={450}>
          <div
            style={{
              padding: 20,
              fontFamily: fonts.code,
              fontSize: 14,
              lineHeight: 1.6,
              color: colors.muted,
            }}
          >
            {frame >= 30 && (
              <div style={{ marginBottom: 20 }}>
                <span style={{ color: colors.amber }}>$ </span>
                <TypingText
                  text="npx openclawd-cli"
                  startFrame={30}
                  charsPerFrame={1}
                  showCursor={frame < 50}
                />
              </div>
            )}

            {frame >= 50 && frame < 70 && (
              <pre
                style={{
                  color: colors.amber,
                  fontSize: 12,
                  lineHeight: 1.2,
                  margin: '20px 0',
                }}
              >
                {`
  ___  ____  _____ _   _  ____ _      _ __        ______
 / _ \\|  _ \\| ____| \\ | |/ ___| |    / \\\\ \\      / /  _ \\
| | | | |_) |  _| |  \\| | |   | |   / _ \\\\ \\ /\\ / /| | | |
| |_| |  __/| |___| |\\  | |___| |__/ ___ \\\\ V  V / | |_| |
 \\___/|_|   |_____|_| \\_|\\____|____/_/   \\_\\_/\\_/  |____/
                `}
              </pre>
            )}

            {frame >= 70 && (
              <div style={{ marginTop: 20 }}>
                {serverLines.map((line, i) => (
                  frame >= line.frame && (
                    <div
                      key={i}
                      style={{
                        color: line.color,
                        opacity: spring({
                          frame: Math.max(0, frame - line.frame),
                          fps: 30,
                          config: { damping: 100, stiffness: 200 },
                        }),
                      }}
                    >
                      {line.text}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </AppWindow>
      </div>
    </AbsoluteFill>
  );
};

export default Scene1_TerminalInstall;
