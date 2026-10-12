'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface PressableCardProps extends Omit<HTMLMotionProps<'div'>, 'onClick'> {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  asButton?: boolean;
  'aria-label'?: string;
}

export const PressableCard: React.FC<PressableCardProps> = ({
  onClick,
  disabled = false,
  className = '',
  children,
  asButton = true,
  'aria-label': ariaLabel,
  ...motionProps
}) => {
  const isInteractive = Boolean(onClick) && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div
      {...motionProps}
      role={isInteractive && asButton ? 'button' : motionProps.role}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel}
      aria-disabled={disabled ? true : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      whileTap={isInteractive ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className={`relative select-none text-left transition-shadow ${
        isInteractive
          ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0DC00] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#12110E]'
          : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};
