'use client';

import React, { useState } from 'react';

export interface AvatarUser {
  id?: string;
  name?: string;
  avatar?: string | null;
  address?: string;
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  user?: AvatarUser | null;
  name?: string;
  src?: string | null;
  id?: string;
  size?: AvatarSize;
  className?: string;
  border?: boolean | 'light' | 'dark' | 'over-image';
  indicator?: React.ReactNode;
  onClick?: () => void;
}

const SIZE_MAP: Record<AvatarSize, { box: string; text: string }> = {
  xs: { box: 'w-5 h-5', text: 'text-[9px]' },
  sm: { box: 'w-7 h-7', text: 'text-[11px]' },
  md: { box: 'w-9 h-9', text: 'text-xs' },
  lg: { box: 'w-12 h-12', text: 'text-sm' },
  xl: { box: 'w-16 h-16', text: 'text-base' },
  '2xl': { box: 'w-20 h-20', text: 'text-xl' },
};

// Curated warm, editorial palette aligned with DESIGN.md (no electric neon).
const PALETTE: Array<{ bg: string; text: string }> = [
  { bg: '#DE6B48', text: '#FFFFFF' }, // Terracotta
  { bg: '#D48B38', text: '#FFFFFF' }, // Warm Ochre
  { bg: '#547A5B', text: '#FFFFFF' }, // Warm Olive
  { bg: '#3D5A80', text: '#FFFFFF' }, // Deep Marine
  { bg: '#8A4F7D', text: '#FFFFFF' }, // Warm Mulberry
  { bg: '#9E5A3F', text: '#FFFFFF' }, // Toasted Sienna
  { bg: '#5C6B73', text: '#FFFFFF' }, // Slate
  { bg: '#8C7051', text: '#FFFFFF' }, // Warm Clay
];

function getHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name?: string, address?: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (address && address.startsWith('0x')) {
    return address.slice(2, 4).toUpperCase();
  }
  return 'U';
}

function isStockPhoto(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('images.unsplash.com');
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  name: nameProp,
  src: srcProp,
  id: idProp,
  size = 'md',
  className = '',
  border = false,
  indicator,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const rawName = nameProp ?? user?.name ?? '';
  const rawId = idProp ?? user?.id ?? user?.address ?? rawName;
  const rawSrc = srcProp ?? user?.avatar ?? null;

  // If the avatar is a stock unsplash photo, discard it to avoid fake stranger avatars
  const validSrc = rawSrc && !isStockPhoto(rawSrc) ? rawSrc : null;

  const initials = getInitials(rawName, user?.address);
  const colorIndex = getHash(rawId || 'default') % PALETTE.length;
  const theme = PALETTE[colorIndex];
  const sizeConfig = SIZE_MAP[size];

  let borderClass = '';
  if (border === true || border === 'light') {
    borderClass = 'border-2 border-[#FFFDF8] dark:border-[#1C1A16]';
  } else if (border === 'dark') {
    borderClass = 'border-2 border-[#171512]';
  } else if (border === 'over-image') {
    borderClass = 'border-2 border-white/90 shadow-sm';
  }

  const Tag = onClick ? 'button' : 'div';
  const roleProps = onClick
    ? { type: 'button' as const, onClick }
    : { role: 'img' };

  return (
    <Tag
      {...roleProps}
      aria-label={rawName || 'User avatar'}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none transition-transform ${
        sizeConfig.box
      } ${borderClass} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0DC00]' : ''} ${className}`}
    >
      {validSrc && !imgError ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={validSrc}
          alt={rawName || 'Avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className={`w-full h-full flex items-center justify-center font-bold tracking-tight ${sizeConfig.text}`}
          style={{ backgroundColor: theme.bg, color: theme.text }}
        >
          {initials}
        </span>
      )}

      {indicator && (
        <span className="absolute bottom-0 right-0 z-10 pointer-events-none">
          {indicator}
        </span>
      )}
    </Tag>
  );
};
