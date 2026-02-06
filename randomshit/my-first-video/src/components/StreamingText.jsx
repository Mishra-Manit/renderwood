import React from 'react';
import { useCurrentFrame } from 'remotion';

export const StreamingText = ({
  text,
  startFrame,
  charsPerFrame = 3,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const framesSinceStart = Math.max(0, frame - startFrame);
  const visibleChars = Math.min(
    text.length,
    Math.floor(framesSinceStart / charsPerFrame)
  );
  const visibleText = text.substring(0, visibleChars);

  return <span style={style}>{visibleText}</span>;
};
