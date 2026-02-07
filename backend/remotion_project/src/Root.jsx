import React from 'react';
import { Composition, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';

export const titleSlideSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().default(''),
  backgroundColor: z.string().min(1),
  textColor: z.string().min(1),
});

const TitleSlide = ({ title, subtitle, backgroundColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleRise = spring({
    frame,
    fps,
    from: 40,
    to: 0,
    config: { damping: 18, stiffness: 120 },
  });
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const subtitleFrame = Math.max(0, frame - 12);
  const subtitleOpacity = interpolate(subtitleFrame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        color: textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
        textAlign: 'center',
        padding: '0 120px',
      }}
    >
      <div style={{ maxWidth: 1200 }}>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -1,
            opacity: titleOpacity,
            transform: `translateY(${titleRise}px)`,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 24,
              fontSize: 40,
              fontWeight: 400,
              lineHeight: 1.2,
              opacity: subtitleOpacity,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="TitleSlide"
      component={TitleSlide}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      schema={titleSlideSchema}
      defaultProps={{
        title: 'Welcome to Renderwood',
        subtitle: 'Your AI-powered title slide',
        backgroundColor: '#111111',
        textColor: '#ffffff',
      }}
    />
  );
};
