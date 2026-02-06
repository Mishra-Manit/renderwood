import React from 'react';
import { colors } from '../constants/colors';

export const AppWindow = ({ children, title, width = 800, height = 600 }) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 40,
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          gap: 8,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#f59e0b',
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#10b981',
          }}
        />
        {title && (
          <div
            style={{
              marginLeft: 'auto',
              marginRight: 'auto',
              color: colors.muted,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {title}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};
