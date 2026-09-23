'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'glass' | 'accent' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'glass',
  size = 'md',
  children,
  icon,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-full gap-1.5 font-medium',
    md: 'px-5 py-2.5 text-sm rounded-full gap-2 font-semibold',
    lg: 'px-7 py-3.5 text-base rounded-full gap-2.5 font-bold',
  }[size];

  const variantClasses = {
    glass: 'liquid-glass-button text-white hover:bg-white/10',
    accent: 'accent-button hover:brightness-105',
    subtle: 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30',
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={`inline-flex items-center justify-center select-none cursor-pointer tracking-tight transition-colors duration-150 ${sizeClasses} ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
};
