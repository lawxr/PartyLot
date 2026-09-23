'use client';

import React, { useMemo } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { monadTestnet } from '@/lib/web3/monad';

// Intercept known upstream React 19 unkeyed child warning originating from Privy SDK internals (xe)
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Each child in a list should have a unique "key" prop') &&
      args.some((a) => typeof a === 'string' && (a.includes('xe') || a.includes('PrivyProvider') || a.includes('PrivyClientProvider')))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

interface PrivyClientProviderProps {
  children: React.ReactNode;
}

export const PrivyClientProvider: React.FC<PrivyClientProviderProps> = ({ children }) => {
  const envAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  // Privy strictly enforces that appId must be a string of exactly 25 characters
  const appId =
    typeof envAppId === 'string' && envAppId.length === 25
      ? envAppId
      : 'cl_placeholder_app_id_25x';

  const privyConfig = useMemo(
    () => ({
      appearance: {
        theme: '#15140f' as const,
        accentColor: '#F0DC00' as `#${string}`,
        showWalletLoginFirst: false,
        walletChainType: 'ethereum-only' as const,
      },
      loginMethods: ['email' as const, 'google' as const, 'apple' as const, 'sms' as const, 'wallet' as const],
      embeddedWallets: {
        ethereum: {
          createOnLogin: 'users-without-wallets' as const,
        },
      },
      defaultChain: monadTestnet,
      supportedChains: [monadTestnet],
    }),
    []
  );

  return (
    <PrivyProvider appId={appId} config={privyConfig}>
      {children}
    </PrivyProvider>
  );
};
