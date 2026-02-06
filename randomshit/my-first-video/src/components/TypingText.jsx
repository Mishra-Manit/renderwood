import React from 'react';
import { useCurrentFrame } from 'remotion';

export const TypingText = ({
  text,
  startFrame,
  charsPerFrame = 2,
  showCursor = true,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const framesSinceStart = Math.max(0, frame - startFrame);
  const visibleChars = Math.min(
    text.length,
    Math.floor(framesSinceStart / charsPerFrame)
  );
  const visibleText = text.substring(0, visibleChars);

  const cursorVisible = showCursor && Math.floor(frame / 15) % 2 === 0;

  return (
    <span style={style}>
      {visibleText}
      {showCursor && visibleChars < text.length && cursorVisible && (
        <span>|</span>
      )}
    </span>
  );
};
