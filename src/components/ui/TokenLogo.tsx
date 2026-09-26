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
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 16 16"
      id="Usdc--Streamline-Cryptocurrency"
      className={`${sizeClass} shrink-0 inline-block drop-shadow-sm ${className}`}
      role="img"
      aria-label="USDC"
    >
      <desc>Usdc Streamline Icon: https://streamlinehq.com</desc>
      <path
        fill="#3e73c4"
        d="M8 16c4.4183 0 8 -3.5817 8 -8 0 -4.41828 -3.5817 -8 -8 -8C3.58172 0 0 3.58172 0 8c0 4.4183 3.58172 8 8 8Z"
        strokeWidth="0.5"
      />
      <path
        fill="#ffffff"
        d="M10.01105 9.062c0 -1.062 -0.64 -1.426 -1.92 -1.578 -0.914 -0.1215 -1.0965 -0.364 -1.0965 -0.789 0 -0.425 0.305 -0.698 0.914 -0.698 0.5485 0 0.8535 0.182 1.0055 0.6375 0.0158 0.04405 0.04475 0.0822 0.08295 0.10925 0.03815 0.0271 0.0837 0.04185 0.13055 0.04225h0.4875c0.02815 0.00075 0.05615 -0.0042 0.08235 -0.0146 0.02615 -0.0104 0.04995 -0.02605 0.0699 -0.0459 0.01995 -0.01985 0.0357 -0.0436 0.0462 -0.0697 0.01055 -0.02615 0.01565 -0.05415 0.01505 -0.0823v-0.03c-0.0596 -0.32955 -0.22635 -0.6302 -0.47435 -0.85525 -0.248 -0.22505 -0.5634 -0.36185 -0.89715 -0.38925V4.571005c0 -0.1215 -0.0915 -0.2125 -0.2435 -0.243h-0.4575c-0.1215 0 -0.213 0.091 -0.2435 0.243V5.269c-0.9145 0.121 -1.493 0.728 -1.493 1.487 0 1.001 0.609 1.3955 1.889 1.5475 0.8535 0.1515 1.1275 0.334 1.1275 0.8195 0 0.485 -0.4265 0.819 -1.0055 0.819 -0.7925 0 -1.0665 -0.3335 -1.158 -0.789 -0.03 -0.121 -0.122 -0.182 -0.2135 -0.182h-0.518c-0.02815 -0.0007 -0.0561 0.00435 -0.0822 0.0148 -0.02615 0.0104 -0.04985 0.02605 -0.0698 0.0459 -0.0199 0.01985 -0.03555 0.04355 -0.04605 0.06965 -0.0105 0.0261 -0.0156 0.05405 -0.01495 0.08215v0.03c0.1215 0.759 0.6095 1.305 1.615 1.457v0.7285c0 0.121 0.0915 0.2125 0.2435 0.2425h0.4575c0.1215 0 0.213 -0.091 0.2435 -0.2425V10.67c0.9145 -0.1515 1.5235 -0.789 1.5235 -1.6085v0.0005Z"
        strokeWidth="0.5"
      />
      <path
        fill="#ffffff"
        d="M6.446 12.2485c-2.37698 -0.85 -3.59598 -3.49 -2.71198 -5.8265 0.457 -1.275 1.46248 -2.2455 2.71198 -2.701 0.122 -0.0605 0.1825 -0.1515 0.1825 -0.3035v-0.425c0 -0.121 -0.0605 -0.212 -0.1825 -0.2425 -0.0305 0 -0.0915 0 -0.122 0.03 -0.68575 0.21416 -1.3224 0.561865 -1.87327 1.023085 -0.550855 0.461225 -1.00503 1.026855 -1.336385 1.664315 -0.331355 0.6375 -0.53334 1.3342 -0.59432 2.05005 -0.06098 0.71585 0.020245 1.4367 0.238995 2.12105 0.548 1.7 1.8585 3.005 3.56498 3.551 0.122 0.0605 0.244 0 0.274 -0.1215 0.0305 -0.03 0.0305 -0.061 0.0305 -0.1215v-0.425c0 -0.091 -0.091 -0.212 -0.1825 -0.273Zm3.23 -9.468c-0.122 -0.061 -0.244 0 -0.274 0.121 -0.0305 0.0305 -0.0305 0.061 -0.0305 0.1215v0.425c0 0.1215 0.091 0.2425 0.1825 0.3035 2.377 0.85 3.596 3.49 2.712 5.8265 -0.457 1.275 -1.4625 2.2455 -2.712 2.701 -0.122 0.0605 -0.1825 0.1515 -0.1825 0.3035v0.425c0 0.121 0.0605 0.212 0.1825 0.2425 0.0305 0 0.0915 0 0.122 -0.03 0.6858 -0.21415 1.32245 -0.56185 1.8733 -1.0231 0.55085 -0.4612 1.00505 -1.02685 1.3364 -1.6643 0.33135 -0.6375 0.53335 -1.3342 0.5943 -2.05005 0.061 -0.71585 -0.02025 -1.4367 -0.239 -2.12105 -0.548 -1.73 -1.889 -3.035 -3.565 -3.581Z"
        strokeWidth="0.5"
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
