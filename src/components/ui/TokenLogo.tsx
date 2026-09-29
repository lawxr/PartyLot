'use client';

import React from 'react';

interface TokenLogoProps {
  token?: 'usdc' | 'mon' | 'eth';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const tokenLabels = {
  usdc: 'USD Coin (USDC)',
  mon: 'Monad (MON)',
  eth: 'Ether (ETH)',
} as const;

const sizeMap = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const UsdcLogo: React.FC<{ size?: TokenLogoProps['size']; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClass = sizeMap[size];
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 inline-block drop-shadow-sm ${className}`}
      role="img"
      aria-label="Circle USDC"
    >
      <path
        d="M48 95C73.9574 95 95 73.9574 95 48C95 22.0426 73.9574 1 48 1C22.0426 1 1 22.0426 1 48C1 73.9574 22.0426 95 48 95Z"
        fill="#0B53BF"
      />
      <path
        d="M56.4609 13.7778V19.8291C68.5341 23.4716 77.3759 34.6928 77.3759 47.9997C77.3759 61.3066 68.5341 72.5278 56.4609 76.1703V82.2216C71.8534 78.4616 83.2509 64.5672 83.2509 47.9997C83.2509 31.4322 71.8534 17.5378 56.4609 13.7778Z"
        fill="white"
      />
      <path
        d="M18.625 47.9997C18.625 34.6928 27.4669 23.4716 39.54 19.8291V13.7778C24.1475 17.5378 12.75 31.4322 12.75 47.9997C12.75 64.5672 24.1475 78.4616 39.54 82.2216V76.1703C27.4669 72.5572 18.625 61.3066 18.625 47.9997Z"
        fill="white"
      />
      <path
        d="M60.6319 54.5506C60.6319 42.5362 41.8025 47.4713 41.8025 40.8325C41.8025 38.4531 43.7119 36.9256 47.3544 36.9256C51.7019 36.9256 53.2 39.0406 53.67 41.89H59.6625C59.1279 36.5426 56.0588 33.1662 50.9382 32.1604V27.4375H45.0632V31.9918C39.4534 32.7062 35.9275 35.973 35.9275 40.8325C35.9275 52.9056 54.7863 48.3819 54.7863 54.9031C54.7863 57.3706 52.4069 59.0156 48.3825 59.0156C43.1244 59.0156 41.3913 56.695 40.745 53.4931H34.8994C35.2781 59.3502 38.8897 63.0159 45.0632 63.9307V68.5625H50.9382V63.9923C56.9633 63.2139 60.6319 59.7089 60.6319 54.5506Z"
        fill="white"
      />
    </svg>
  );
};

export const BaseLogo: React.FC<{ size?: TokenLogoProps['size']; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClass = sizeMap[size];
  return (
    <svg
      viewBox="0 0 1280 1280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 inline-block drop-shadow-sm ${className}`}
      role="img"
      aria-label="Base Network"
    >
      <path
        fill="#0052FF"
        d="M0,101.12c0-34.64,0-51.95,6.53-65.28,6.25-12.76,16.56-23.07,29.32-29.32C49.17,0,66.48,0,101.12,0h1077.76c34.63,0,51.96,0,65.28,6.53,12.75,6.25,23.06,16.56,29.32,29.32,6.52,13.32,6.52,30.64,6.52,65.28v1077.76c0,34.63,0,51.96-6.52,65.28-6.26,12.75-16.57,23.06-29.32,29.32-13.32,6.52-30.65,6.52-65.28,6.52H101.12c-34.64,0-51.95,0-65.28-6.52-12.76-6.26-23.07-16.57-29.32-29.32-6.53-13.32-6.53-30.65-6.53-65.28V101.12Z"
      />
    </svg>
  );
};

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
      role="img"
      aria-label={tokenLabels.mon}
    >
      <circle cx="16" cy="16" r="16" fill="#836EF9" />
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
