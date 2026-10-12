'use client';

import React, { useState, useEffect } from 'react';

export interface AvatarUser {
  id?: string;
  name?: string;
  avatar?: string | null;
  address?: string;
  walletAddress?: string;
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
  xs: { box: 'w-5 h-5 min-w-5 min-h-5 aspect-square', text: 'text-[9px]' },
  sm: { box: 'w-7 h-7 min-w-7 min-h-7 aspect-square', text: 'text-[11px]' },
  md: { box: 'w-9 h-9 min-w-9 min-h-9 aspect-square', text: 'text-xs' },
  lg: { box: 'w-12 h-12 min-w-12 min-h-12 aspect-square', text: 'text-sm' },
  xl: { box: 'w-16 h-16 min-w-16 min-h-16 aspect-square', text: 'text-base' },
  '2xl': { box: 'w-20 h-20 min-w-20 min-h-20 aspect-square', text: 'text-xl' },
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

/**
 * Normalizes damaged or corrupted profile names (e.g. "undefined", "null", "[object Object]", raw 0x addresses)
 */
function cleanProfileName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === 'undefined' ||
    lower === 'null' ||
    lower === '[object object]' ||
    lower === 'nan' ||
    lower === 'none' ||
    lower === 'false'
  ) {
    return '';
  }
  // Strip leading @ handle character if present
  if (trimmed.startsWith('@') && trimmed.length > 1) {
    return trimmed.slice(1);
  }
  return trimmed;
}

function getInitials(name?: string, address?: string): string {
  const cleanName = cleanProfileName(name);

  if (cleanName) {
    // If the name is literally a raw Ethereum address (e.g. 0x0419F23...)
    if (cleanName.startsWith('0x') && cleanName.length >= 6) {
      return cleanName.slice(2, 4).toUpperCase();
    }
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  // Fallback to address
  if (address && address.startsWith('0x') && address.length >= 6) {
    return address.slice(2, 4).toUpperCase();
  }

  return 'PA';
}

function isValidAvatarUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'false') return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  );
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

  const rawName = cleanProfileName(nameProp ?? user?.name ?? '');
  const walletAddr = user?.address || user?.walletAddress || '';
  const rawId = idProp ?? user?.id ?? walletAddr ?? rawName;
  const rawSrc = srcProp ?? user?.avatar ?? null;

  const validSrc = isValidAvatarUrl(rawSrc) ? rawSrc : null;

  // Reset imgError whenever source changes so newly uploaded photos render immediately
  useEffect(() => {
    setImgError(false);
  }, [validSrc]);

  const initials = getInitials(rawName, walletAddr);
  // Anchor colorSeed to clean name or identifier so user has identical theme across all views
  const colorSeed = rawName || rawId || 'default';
  const colorIndex = getHash(colorSeed) % PALETTE.length;
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
      style={{
        WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        isolation: 'isolate',
      }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full aspect-square overflow-hidden select-none box-border transition-transform ${
        sizeConfig.box
      } ${borderClass} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0DC00]' : ''} ${className}`}
    >
      {validSrc && !imgError ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={validSrc}
          alt={rawName || 'Avatar'}
          className="w-full h-full object-cover rounded-full aspect-square pointer-events-none block"
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
