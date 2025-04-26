import React from 'react';
import { SecurityLevel } from '../../types/security';
import { getSecurityLevelColor, getSecurityLevelDisplayName } from '../../core/security-levels';

export interface SecurityBadgeProps {
  level: SecurityLevel;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  level,
  size = 'medium',
  showDescription = false,
}) => {
  const color = getSecurityLevelColor(level);
  const displayName = getSecurityLevelDisplayName(level);

  const sizes = {
    small: { padding: '2px 8px', fontSize: '12px' },
    medium: { padding: '4px 12px', fontSize: '14px' },
    large: { padding: '6px 16px', fontSize: '16px' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: `${color}20`,
        color: color,
        borderRadius: '9999px',
        border: `1px solid ${color}`,
        fontWeight: 500,
        ...sizes[size],
      }}
    >
      {displayName}
      {showDescription && (
        <span style={{ marginLeft: '8px', opacity: 0.8, fontSize: '0.9em' }}>
          {level === SecurityLevel.CRITICAL && '⚠️'}
        </span>
      )}
    </span>
  );
};