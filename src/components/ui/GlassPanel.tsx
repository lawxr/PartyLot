'use client';

import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  level = 2,
  children,
  className = '',
  ...props
}) => {
  const levelClass =
    level === 1
      ? 'liquid-glass-nav'
      : level === 3
      ? 'liquid-glass-modal'
      : 'liquid-glass-card';

  return (
    <div
      className={`rounded-3xl ${levelClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
