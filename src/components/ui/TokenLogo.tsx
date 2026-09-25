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

export const UsdcLogo: React.FC<{ size?: TokenLogoProps['size']; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClass = sizeMap[size];
  return (
    <svg
      viewBox="0 0 2000 2000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 inline-block drop-shadow-sm ${className}`}
      aria-label="USDC"
    >
      <g clipPath="url(#clip0)">
        <path
          d="M1000 2000C1549.51 2000 2000 1549.51 2000 1000C2000 450.495 1549.51 0 1000 0C450.495 0 0 450.495 0 1000C0 1549.51 450.495 2000 1000 2000Z"
          fill="#2775CA"
        />
        <path
          d="M1275 1393.74C1275 1290.19 1210.59 1237.88 1078.13 1218.44C968.75 1202.87 943.75 1175.31 943.75 1125C943.75 1074.69 978.13 1040.31 1046.88 1040.31C1109.38 1040.31 1146.88 1065.31 1165.63 1109.38H1268.75C1250 1018.75 1171.88 956.25 1078.13 940.625V806.25H1015.63V940.625C890.625 956.25 793.75 1034.38 793.75 1134.38C793.75 1234.38 859.375 1287.5 987.5 1306.25C1090.63 1321.88 1121.88 1346.88 1121.88 1400C1121.88 1453.13 1078.13 1487.5 1003.13 1487.5C921.875 1487.5 871.875 1453.13 853.125 1403.13H746.875C768.75 1506.25 856.25 1571.88 1015.63 1590.63V1725H1078.13V1590.63C1203.13 1575 1275 1509.38 1275 1393.74Z"
          fill="white"
        />
        <path
          d="M668.125 1428.13C484.375 1334.38 409.375 1096.88 503.125 906.25C559.375 790.625 678.125 709.375 815.625 690.625V809.375C665.625 831.25 553.125 956.25 575 1109.38C590.625 1228.13 678.125 1325 793.75 1353.13L668.125 1428.13Z"
          fill="white"
        />
        <path
          d="M1331.88 828.125C1325 1000 1184.38 1134.38 1015.63 1125L1140.63 1050C1250 1034.38 1334.38 953.125 1353.13 843.75C1384.38 665.625 1265.63 490.625 1087.5 459.375V340.625C1331.88 371.875 1500 584.375 1468.75 828.125C1468.75 828.125 1331.88 828.125 1331.88 828.125Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="2000" height="2000" fill="white" />
        </clipPath>
      </defs>
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
      aria-label="Monad"
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
