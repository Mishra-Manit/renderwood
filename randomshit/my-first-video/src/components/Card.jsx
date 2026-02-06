import React from 'react';
import { colors } from '../constants/colors';

export const Card = ({
  children,
  onClick,
  icon,
  title,
  description,
  badge,
  style = {},
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {icon && <div style={{ marginBottom: 12 }}>{icon}</div>}
      {title && (
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: colors.white,
            marginBottom: 4,
          }}
        >
          {title}
        </div>
      )}
      {description && (
        <div
          style={{
            fontSize: 13,
            color: colors.muted,
            marginBottom: badge ? 8 : 0,
          }}
        >
          {description}
        </div>
      )}
      {badge && <div>{badge}</div>}
      {children}
    </div>
  );
};
