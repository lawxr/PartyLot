'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { monadTestnet } from '@/lib/web3/monad';

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

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#F0DC00',
          showWalletLoginFirst: false,
          walletChainType: 'ethereum-only',
          walletList: [
            'detected_wallets',
            'metamask',
            'coinbase_wallet',
            'rainbow',
            'wallet_connect',
          ],
        },
        loginMethods: ['email', 'google', 'apple', 'sms', 'wallet'],
        externalWallets: {
          walletConnect: {
            enabled: true,
          },
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
      }}
    >
      {children}
    </PrivyProvider>
  );
};
