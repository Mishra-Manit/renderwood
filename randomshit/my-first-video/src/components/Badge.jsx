import React from 'react';
import { colors } from '../constants/colors';

export const Badge = ({ children, color = colors.amber, size = 'md' }) => {
  const padding = size === 'sm' ? '4px 8px' : '6px 12px';
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <span
      style={{
        display: 'inline-block',
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: 999,
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  );
};
