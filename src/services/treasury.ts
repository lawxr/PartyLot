import type { DebtSettlement, PotTransaction } from '@/types';
import { getMonadExplorerTxUrl } from '@/lib/web3/monad';

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
  token: 'USDC';
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
    ? 'Tesorería activa en Monad Testnet (USDC / MON).'
    : 'Treasury active on Monad Testnet (USDC / MON).';
}

export function getFinancialActionUnavailableResult(
  language: 'en' | 'es' = 'en'
): FinancialActionResult {
  return {
    status: 'available',
    message: getFinancialActionsUnavailableMessage(language),
  };
}

/**
 * Executes an onchain deposit into the shared party pot on Monad Testnet.
 */
export async function depositToPartyPotOnchain(
  partyId: string,
  amount: number,
  options?: {
    userAddress?: string;
    userId?: string;
    userName?: string;
  }
): Promise<TreasuryReceipt> {
  const res = await fetch('/api/treasury/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deposit',
      partyId,
      amount,
      userAddress: options?.userAddress,
      userId: options?.userId,
      userName: options?.userName,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to deposit into Monad Treasury.');
  }

  return {
    success: true,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl || getMonadExplorerTxUrl(data.txHash),
    amount: data.amount,
    token: 'USDC',
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
    throw new Error(data.error || 'Failed to distribute bounty on Monad.');
  }

  return {
    success: true,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl || getMonadExplorerTxUrl(data.txHash),
    amount: data.amount,
    token: 'USDC',
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
      action: 'reimbursement',
      partyId,
      amount: totalAmount,
      userAddress,
      description: `Settlement of ${settlements.length} debts totaling $${totalAmount.toFixed(2)} USDC`,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to settle debt on Monad.');
  }

  return {
    success: true,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl || getMonadExplorerTxUrl(data.txHash),
    amount: totalAmount,
    token: 'USDC',
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
      partyId: nextPartyId,
      amount,
      description: `Rollover of $${amount.toFixed(2)} USDC to next gathering`,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to rollover funds on Monad.');
  }

  return {
    success: true,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl || getMonadExplorerTxUrl(data.txHash),
    amount,
    token: 'USDC',
    network: 'Monad Testnet',
  };
}
