'use client';

import React from 'react';

interface TokenLogoProps {
  token?: 'usdc' | 'mon' | 'eth';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * Official Circle USDC Logo Vector
 */
export const UsdcLogo: React.FC<{ size?: TokenLogoProps['size']; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClass = sizeMap[size];
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 inline-block drop-shadow-sm ${className}`}
      aria-label="USDC"
    >
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      {/* Outer parentheses / arcs */}
      <path
        d="M11.6 22.8c-3.6-2.1-4.8-6.7-2.7-10.3 1.3-2.2 3.6-3.6 6.1-3.8v1.7c-3.7.5-6.3 3.9-5.8 7.6.4 2.7 2.3 4.9 5 5.5l-.6 1.7c-.7-.3-1.4-.7-2-1.2v-.2zm11.2-5.3c-.4 3.7-3.6 6.5-7.3 6.3l.6-1.7c2.7-.4 4.8-2.5 5.3-5.2.7-3.7-1.8-7.1-5.5-7.7V7.2c4.2.5 7.3 4.2 6.9 8.4v1.9z"
        fill="#FFFFFF"
      />
      {/* Center Dollar Sign */}
      <path
        d="M19.7 18.3c0-1.7-1-2.3-3.1-2.5-1.5-.2-1.8-.6-1.8-1.3 0-.7.6-1.2 1.6-1.2 1 0 1.5.4 1.8 1.1h1.7c-.3-1.4-1.3-2.3-2.7-2.5V10h-1.6v1.9c-1.7.3-2.8 1.5-2.8 3 0 1.7 1.1 2.4 3.1 2.6 1.5.3 1.8.6 1.8 1.4 0 .8-.7 1.3-1.7 1.3-1.2 0-1.8-.5-2-1.3h-1.8c.3 1.6 1.4 2.5 3 2.7V24h1.6v-1.9c1.8-.3 3-1.6 3-3.8z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

/**
 * Official Monad Network Logo Vector
 */
export const MonadLogo: React.FC<{ size?: TokenLogoProps['size']; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClass = sizeMap[size];
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 inline-block drop-shadow-sm ${className}`}
      aria-label="Monad"
    >
      <circle cx="16" cy="16" r="16" fill="#836EF9" />
      {/* Monad stylized geometry */}
      <path
        d="M16 6.8c-.5 0-1 .2-1.3.6l-6.8 6.8c-.7.7-.7 1.9 0 2.6l6.8 6.8c.4.4.8.6 1.3.6s1-.2 1.3-.6l6.8-6.8c.7-.7.7-1.9 0-2.6l-6.8-6.8c-.3-.4-.8-.6-1.3-.6zm0 4.2l4.8 4.8L16 20.6l-4.8-4.8L16 11z"
        fill="#FFFFFF"
      />
      <circle cx="16" cy="16" r="2.2" fill="#FFFFFF" />
    </svg>
  );
};

export const TokenLogo: React.FC<TokenLogoProps> = ({
  token = 'usdc',
  size = 'md',
  className = '',
}) => {
  if (token === 'mon') {
    return <MonadLogo size={size} className={className} />;
  }
  return <UsdcLogo size={size} className={className} />;
};

interface CryptoBadgeProps {
  token?: 'usdc' | 'mon';
  network?: string;
  className?: string;
  showNetwork?: boolean;
}

export const CryptoBadge: React.FC<CryptoBadgeProps> = ({
  token = 'usdc',
  network = 'Monad',
  className = '',
  showNetwork = true,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${
        token === 'usdc'
          ? 'bg-[#2775CA]/10 text-[#1E5DA2] dark:text-[#64B5F6] border-[#2775CA]/20'
          : 'bg-[#836EF9]/10 text-[#674FF4] dark:text-[#B8A8FF] border-[#836EF9]/20'
      } ${className}`}
    >
      <TokenLogo token={token} size="xs" />
      <span>{token.toUpperCase()}</span>
      {showNetwork && (
        <span className="opacity-70 font-medium text-[10px]">· {network}</span>
      )}
    </span>
  );
};
