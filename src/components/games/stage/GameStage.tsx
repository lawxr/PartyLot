'use client';

import React from 'react';

interface GameStageProps {
  children: React.ReactNode;
  partyCoverImage?: string | null;
  className?: string;
}

/**
 * GameStage container providing the warm radial stage background,
 * centered mobile-first viewport (max 430px), and optional blurred desktop backdrop.
 */
export const GameStage: React.FC<GameStageProps> = ({
  children,
  partyCoverImage,
  className = '',
}) => {
  return (
    <div
      className="relative min-h-[100dvh] w-full flex flex-col items-center justify-start overflow-x-hidden transition-colors duration-300"
      style={{
        background: 'var(--stage-bg)',
      }}
    >
      {/* Desktop blurred ambient backdrop */}
      {partyCoverImage && (
        <div
          aria-hidden="true"
          className="hidden lg:block absolute inset-0 pointer-events-none opacity-20 filter blur-3xl bg-center bg-cover scale-110"
          style={{ backgroundImage: `url("${partyCoverImage}")` }}
        />
      )}

      {/* Centered stage frame (max-w-[430px]) */}
      <div
        className={`relative z-10 w-full max-w-[430px] flex-1 flex flex-col justify-between px-4 sm:px-5 py-3 text-[var(--stage-text)] select-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
