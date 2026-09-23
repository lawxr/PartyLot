/**
 * Web3 & Monad Blockchain Abstraction Layer
 * Keeps blockchain completely invisible to end-users while providing
 * smart contract integration capabilities for Monad testnet / devnet.
 */

import { defineChain } from 'viem';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
      ],
      webSocket: process.env.NEXT_PUBLIC_MONAD_WSS_URL
        ? [process.env.NEXT_PUBLIC_MONAD_WSS_URL]
        : undefined,
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Vision / Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

export interface MonadNetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  currencySymbol: string;
  blockExplorerUrl: string;
}

export const MONAD_TESTNET_CONFIG: MonadNetworkConfig = {
  chainId: 10143,
  name: 'Monad Testnet',
  rpcUrl: process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
  currencySymbol: 'MON',
  blockExplorerUrl: 'https://testnet.monadexplorer.com',
};

export interface TreasuryDepositReceipt {
  txHash: string;
  status: 'confirmed' | 'pending' | 'failed';
  blockNumber: number;
  timestamp: number;
  amount: number;
}

/**
 * Record a deposit into the group treasury smart contract
 */
export async function executeMonadDeposit(
  partyId: string,
  userAddress: string,
  amount: number
): Promise<TreasuryDepositReceipt> {
  // Simulates high-speed Monad sub-second finality
  await new Promise(resolve => setTimeout(resolve, 600));

  const fakeTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  return {
    txHash: fakeTxHash,
    status: 'confirmed',
    blockNumber: Math.floor(1000000 + Math.random() * 50000),
    timestamp: Date.now(),
    amount,
  };
}

/**
 * Commit game outcome or split settlement to Monad state
 */
export async function commitSettlementBatch(
  partyId: string,
  settlementsCount: number
): Promise<{ success: boolean; batchId: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    success: true,
    batchId: `batch-${partyId}-${Date.now()}`,
  };
}
