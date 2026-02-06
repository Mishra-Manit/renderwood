import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { StreamingText } from '../components/StreamingText';
import { fadeInScale } from '../animations/transitions';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export const Scene3_ChatInterface = () => {
  const frame = useCurrentFrame();

  const chatHistory = [
    'MCP Integration',
    'Code Review',
    'Database Schema',
    'API Design',
  ];

  const progressSteps = [
    { label: 'Reading files', frame: 40, icon: '📄' },
    { label: 'Security analysis', frame: 60, icon: '🔒' },
    { label: 'Applying fixes', frame: 80, icon: '⚡' },
    { label: 'Creating PR', frame: 100, icon: '✓' },
  ];

  const toolCalls = [
    { label: 'filesystem.read', frame: 50 },
    { label: 'bash.exec', frame: 70 },
    { label: 'github.create_pr', frame: 90 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        display: 'flex',
      }}
    >
      <div
        style={{
          width: 250,
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          padding: 16,
          ...fadeInScale(frame, 0),
        }}
      >
        <h3
          style={{
            fontFamily: fonts.ui,
            fontSize: 14,
            fontWeight: 600,
            color: colors.muted,
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          History
        </h3>
        {chatHistory.map((chat, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              marginBottom: 8,
              borderRadius: 6,
              fontFamily: fonts.ui,
              fontSize: 14,
              color: i === 1 ? colors.white : colors.muted,
              backgroundColor: i === 1 ? `${colors.amber}20` : 'transparent',
              border: i === 1 ? `1px solid ${colors.amber}40` : '1px solid transparent',
            }}
          >
            {chat}
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {frame >= 20 && (
          <div
            style={{
              ...fadeInScale(frame, 20),
              alignSelf: 'flex-end',
              maxWidth: '70%',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: colors.amber,
                color: colors.bg,
                borderRadius: 12,
                fontFamily: fonts.ui,
                fontSize: 15,
              }}
            >
              Review my API code
            </div>
          </div>
        )}

        {frame >= 30 && (
          <div style={{ maxWidth: '80%' }}>
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                fontFamily: fonts.ui,
                fontSize: 15,
                color: colors.white,
                lineHeight: 1.6,
              }}
            >
              <StreamingText
                text="I've found several security issues in your API code. The authentication middleware is missing input validation, and there are potential SQL injection vulnerabilities. I'll fix these issues and create a PR for you."
                startFrame={30}
                charsPerFrame={2}
              />
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          width: 300,
          backgroundColor: colors.surface,
          borderLeft: `1px solid ${colors.border}`,
          padding: 16,
        }}
      >
        <h3
          style={{
            fontFamily: fonts.ui,
            fontSize: 14,
            fontWeight: 600,
            color: colors.muted,
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Progress
        </h3>
        {progressSteps.map((step, i) => (
          frame >= step.frame && (
            <div
              key={i}
              style={{
                ...fadeInScale(frame, step.frame),
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                fontFamily: fonts.ui,
                fontSize: 14,
                color: colors.white,
              }}
            >
              <span style={{ fontSize: 18 }}>{step.icon}</span>
              <span>{step.label}</span>
            </div>
          )
        ))}

        <h3
          style={{
            fontFamily: fonts.ui,
            fontSize: 14,
            fontWeight: 600,
            color: colors.muted,
            margin: '24px 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Tool Calls
        </h3>
        {toolCalls.map((tool, i) => (
          frame >= tool.frame && (
            <div
              key={i}
              style={{
                ...fadeInScale(frame, tool.frame),
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                marginBottom: 8,
                backgroundColor: `${colors.amber}10`,
                border: `1px solid ${colors.amber}30`,
                borderRadius: 6,
                fontFamily: fonts.code,
                fontSize: 12,
                color: colors.amber,
              }}
            >
              <span>✓</span>
              <span>{tool.label}</span>
            </div>
          )
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Scene3_ChatInterface;
