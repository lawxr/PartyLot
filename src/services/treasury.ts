import type { DebtSettlement, PotTransaction } from '@/types';
import { createWalletClient, custom, parseEther } from 'viem';
import { monadTestnet, publicMonadClient, getMonadExplorerTxUrl, toPartyBytes32 } from '@/lib/web3/monad';
import { MONAD_CONTRACT_ADDRESSES, PartyTreasuryABI } from '@/contracts';
import { getSupabase } from '@/lib/supabase/client';

/**
 * Onchain Financial Treasury & Settlement is live on Monad Testnet (Chain ID: 10143)
 */
export const FINANCIAL_ACTIONS_AVAILABLE = true as const;

export interface TreasuryReceipt {
  success: boolean;
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
  amount: number;
  token: 'MON' | 'USDC';
  network: 'Monad Testnet';
}

export type FinancialActionResult = {
  status: 'available';
  message: string;
  receipt?: TreasuryReceipt;
};

export function calculateTotalContributed(transactions: PotTransaction[]): number {
  return transactions
    .filter((transaction) => transaction.type === 'add')
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function calculateTotalSpent(transactions: PotTransaction[]): number {
  return transactions
    .filter((transaction) => transaction.type === 'spend')
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function getFinancialActionsUnavailableMessage(language: 'en' | 'es'): string {
  return language === 'es'
    ? 'Tesorería activa en Monad Testnet (MON nativo).'
    : 'Treasury active on Monad Testnet (native MON).';
}

export function getFinancialActionUnavailableResult(
  language: 'en' | 'es' = 'en'
): FinancialActionResult {
  return {
    status: 'available',
    message: getFinancialActionsUnavailableMessage(language),
  };
}

export interface ConnectedUserWallet {
  address: string;
  chainId: string;
  switchChain?: (targetChainId: `0x${string}` | number) => Promise<void>;
  getEthereumProvider: () => Promise<unknown>;
}

/**
 * Executes an onchain deposit into the shared party pot on Monad Testnet.
 * If a connected user wallet is provided, the transaction is signed and broadcast directly
 * by the user's wallet (non-custodial). Otherwise, it uses the server relayer endpoint.
 */
export async function depositToPartyPotOnchain(
  partyId: string,
  amount: number,
  options?: {
    wallet?: ConnectedUserWallet;
    userAddress?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
  }
): Promise<TreasuryReceipt> {
  const numAmount = Math.max(0.0001, amount);

  // 1. Non-custodial direct client execution when user wallet is connected
  if (options?.wallet) {
    const wallet = options.wallet;

    if (wallet.chainId !== 'eip155:10143' && typeof wallet.switchChain === 'function') {
      try {
        await wallet.switchChain(10143);
      } catch (err) {
        console.warn('Network switch notice:', err);
      }
    }

    const provider = (await wallet.getEthereumProvider()) as Parameters<typeof custom>[0];
    const walletClient = createWalletClient({
      account: wallet.address as `0x${string}`,
      chain: monadTestnet,
      transport: custom(provider),
    });

    const partyBytes = toPartyBytes32(partyId);
    const monWei = parseEther(String(Math.max(0.000001, Number(numAmount.toFixed(6)))));

    const txHash = await walletClient.writeContract({
      address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      abi: PartyTreasuryABI,
      functionName: 'deposit',
      args: [partyBytes],
      value: monWei,
      gas: BigInt(350000),
    });

    const receipt = await publicMonadClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 30_000,
    });

    if (receipt && receipt.status === 'reverted') {
      throw new Error(`Transaction reverted onchain (Hash: ${txHash})`);
    }

    const blockNumber = Number(receipt?.blockNumber || 65050000);

    // Synchronize Supabase persistent state
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('pot_transactions').insert({
          id: `pot-tx-${Date.now()}`,
          party_id: partyId,
          amount: numAmount,
          type: 'add',
          description: `Deposit of ${numAmount.toFixed(4)} MON via User Wallet on Monad`,
          user_name: options?.userName || 'Party Member',
          user_avatar:
            options?.userAvatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          created_at: new Date().toISOString(),
        });

        await supabase.from('activities').insert({
          id: `act-treasury-${Date.now()}`,
          party_id: partyId,
          type: 'pot',
          text: `💰 ${options?.userName || 'Alguien'} aportó ${numAmount.toFixed(4)} MON al Party Pot desde su billetera`,
          time: 'Just now',
        });
      }
    } catch (dbErr) {
      console.warn('Supabase sync notice:', dbErr);
    }

    return {
      success: true,
      txHash,
      blockNumber,
      explorerUrl: getMonadExplorerTxUrl(txHash),
      amount: numAmount,
      token: 'MON',
      network: 'Monad Testnet',
    };
  }

  // 2. Relayer / Sponsored Fallback when no client wallet is provided
  const res = await fetch('/api/treasury/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deposit',
      partyId,
      amount: numAmount,
      userAddress: options?.userAddress,
      userId: options?.userId,
      userName: options?.userName,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to deposit into Monad Treasury.');
  }

  return {
    success: true,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl || getMonadExplorerTxUrl(data.txHash),
    amount: data.amount,
    token: (data.token as 'MON' | 'USDC') || 'MON',
    network: 'Monad Testnet',
  };
}

/**
 * Distributes an economic reward / bounty on Monad Testnet.
 */
export async function distributeBountyOnchain(
  partyId: string,
  recipientAddress: string,
  amount: number,
  role: string,
  recipientName?: string
): Promise<TreasuryReceipt> {
  const res = await fetch('/api/treasury/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reward',
      partyId,
      amount,
      recipientAddress,
      recipientName,
      role,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to distribute bounty on Monad.');
  }

  return {
    success: true,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl || getMonadExplorerTxUrl(data.txHash),
    amount: data.amount,
    token: (data.token as 'MON' | 'USDC') || 'MON',
    network: 'Monad Testnet',
  };
}

/**
 * Settles debts between group members on Monad Testnet.
 */
export async function settleDamageOnchain(
  partyId: string,
  settlements: DebtSettlement[],
  userAddress?: string
): Promise<TreasuryReceipt> {
  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);

  const res = await fetch('/api/treasury/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'settle',
      partyId,
      amount: totalAmount,
      userAddress,
      recipientAddress: settlements[0]?.toId || userAddress,
      description: `Settlement of ${settlements.length} debts totaling ${totalAmount.toFixed(4)} MON`,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to settle debt on Monad.');
  }

  return {
    success: true,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl || getMonadExplorerTxUrl(data.txHash),
    amount: totalAmount,
    token: (data.token as 'MON' | 'USDC') || 'MON',
    network: 'Monad Testnet',
  };
}

/**
 * Rolls over remaining funds to the next party treasury on Monad.
 */
export async function rolloverFundsOnchain(
  fromTreasury: string,
  nextPartyId: string,
  amount: number
): Promise<TreasuryReceipt> {
  const res = await fetch('/api/treasury/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'rollover',
      partyId: fromTreasury,
      toPartyId: nextPartyId,
      amount,
      description: `Rollover of ${amount.toFixed(4)} MON to next gathering`,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to rollover funds on Monad.');
  }

  return {
    success: true,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl || getMonadExplorerTxUrl(data.txHash),
    amount,
    token: (data.token as 'MON' | 'USDC') || 'MON',
    network: 'Monad Testnet',
  };
}
