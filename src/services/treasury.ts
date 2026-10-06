import type { DebtSettlement, PotTransaction } from '@/types';
import { createWalletClient, custom, parseEther, formatEther } from 'viem';
import { monadTestnet, publicMonadClient, getMonadExplorerTxUrl, toPartyBytes32 } from '@/lib/web3/monad';
import { MONAD_CONTRACT_ADDRESSES, PartyTreasuryABI } from '@/contracts';
import { getClientPrivyToken } from '@/hooks/usePrivySync';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getClientPrivyToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

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
  receipts?: TreasuryReceipt[];
  settledCount?: number;
}

export interface BatchSettlementReceipt extends TreasuryReceipt {
  receipts: TreasuryReceipt[];
  settledCount: number;
}

export class PartialSettlementError extends Error {
  public successfulReceipts: TreasuryReceipt[];
  public settledSettlements: DebtSettlement[];
  public failedSettlement: DebtSettlement;
  public remainingSettlements: DebtSettlement[];

  constructor(
    message: string,
    successfulReceipts: TreasuryReceipt[],
    settledSettlements: DebtSettlement[],
    failedSettlement: DebtSettlement,
    remainingSettlements: DebtSettlement[]
  ) {
    super(message);
    this.name = 'PartialSettlementError';
    this.successfulReceipts = successfulReceipts;
    this.settledSettlements = settledSettlements;
    this.failedSettlement = failedSettlement;
    this.remainingSettlements = remainingSettlements;
  }
}

export type FinancialActionResult = {
  status: 'available';
  message: string;
  receipt?: TreasuryReceipt;
  partial?: boolean;
  settledCount?: number;
  remainingCount?: number;
  successfulReceipts?: TreasuryReceipt[];
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

    // Ensure the party is registered onchain in PartyTreasury before user deposits
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/treasury/action', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'register',
          partyId,
          recipientAddress: wallet.address,
        }),
      });
    } catch {
      // Non-blocking if already registered or network transient
    }

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

    // Synchronize server-side persistent state securely via BFF endpoint
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/treasury/record-deposit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          partyId,
          txHash,
          amount: numAmount,
          userName: options?.userName || 'Party Member',
          userAvatar: options?.userAvatar,
        }),
      });
    } catch (syncErr) {
      console.warn('Server treasury record sync notice:', syncErr);
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
  const headers = await getAuthHeaders();
  const res = await fetch('/api/treasury/action', {
    method: 'POST',
    headers,
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
  const headers = await getAuthHeaders();
  const res = await fetch('/api/treasury/action', {
    method: 'POST',
    headers,
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
 * Requires connected wallet to sign non-custodial settleDebt transaction in native MON.
 */
export interface SettleDamageOptions {
  wallet?: ConnectedUserWallet;
  onSettlementConfirmed?: (progress: {
    settlement: DebtSettlement;
    receipt: TreasuryReceipt;
    index: number;
    total: number;
  }) => void | Promise<void>;
}

/**
 * Settles debts between group members on Monad Testnet.
 * Requires connected wallet to sign non-custodial settleDebt transactions in native MON.
 * Executes each creditor transfer individually and returns detailed receipts.
 */
export async function settleDamageOnchain(
  partyId: string,
  settlements: DebtSettlement[],
  userAddress?: string,
  options?: SettleDamageOptions
): Promise<BatchSettlementReceipt> {
  if (!settlements || settlements.length === 0) {
    throw new Error('No pending debts to settle.');
  }

  // Security & Financial Integrity Check:
  // Each creditor must possess a verified 42-character Monad/Ethereum address (0x...).
  const unverified = settlements.filter(
    (s) => !s.toId || !s.toId.startsWith('0x') || s.toId.length !== 42
  );
  if (unverified.length > 0) {
    throw new Error(
      `All creditors must have a verified wallet address (0x...). Unverified: ${unverified.map((u) => u.toName || u.toId).join(', ')}`
    );
  }

  const invalidAmounts = settlements.filter((s) => s.amount <= 0);
  if (invalidAmounts.length > 0) {
    throw new Error('Settlement amount must be > 0.');
  }

  // User obligations cannot use server relayer (fail closed)
  if (!options?.wallet) {
    throw new Error('Connect your wallet to settle debts directly on Monad Testnet (MON).');
  }

  const wallet = options.wallet;
  for (const s of settlements) {
    if (wallet.address && s.toId.toLowerCase() === wallet.address.toLowerCase()) {
      throw new Error('Cannot settle debt with yourself.');
    }
  }

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
  const successfulReceipts: TreasuryReceipt[] = [];
  const settledSettlements: DebtSettlement[] = [];

  for (let i = 0; i < settlements.length; i++) {
    const s = settlements[i];
    try {
      const monWei = parseEther(String(Math.max(0.000001, Number(s.amount.toFixed(6)))));

      const txHash = await walletClient.writeContract({
        address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
        abi: PartyTreasuryABI,
        functionName: 'settleDebt',
        args: [partyBytes, s.toId as `0x${string}`],
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
      const individualReceipt: TreasuryReceipt = {
        success: true,
        txHash,
        blockNumber,
        explorerUrl: getMonadExplorerTxUrl(txHash),
        amount: s.amount,
        token: 'MON',
        network: 'Monad Testnet',
      };

      successfulReceipts.push(individualReceipt);
      settledSettlements.push(s);

      if (options?.onSettlementConfirmed) {
        await options.onSettlementConfirmed({
          settlement: s,
          receipt: individualReceipt,
          index: i,
          total: settlements.length,
        });
      }
    } catch (err: unknown) {
      if (successfulReceipts.length > 0) {
        const remainingSettlements = settlements.slice(i);
        const errMsg = err instanceof Error ? err.message : String(err);
        throw new PartialSettlementError(
          `Partial settlement: ${successfulReceipts.length} of ${settlements.length} transfers succeeded. Failed at transfer to ${s.toName || s.toId}: ${errMsg}`,
          successfulReceipts,
          settledSettlements,
          s,
          remainingSettlements
        );
      }
      throw err;
    }
  }

  const primaryReceipt = successfulReceipts[successfulReceipts.length - 1];
  const totalAmount = Number(
    successfulReceipts.reduce((sum, r) => sum + r.amount, 0).toFixed(6)
  );

  return {
    success: true,
    txHash: primaryReceipt.txHash,
    blockNumber: primaryReceipt.blockNumber,
    explorerUrl: primaryReceipt.explorerUrl,
    amount: totalAmount,
    token: 'MON',
    network: 'Monad Testnet',
    receipts: successfulReceipts,
    settledCount: successfulReceipts.length,
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
  const headers = await getAuthHeaders();
  const res = await fetch('/api/treasury/action', {
    method: 'POST',
    headers,
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

/**
 * Reads the verified onchain pot balance for a party from PartyTreasury.sol on Monad Testnet.
 */
export async function getPartyPotBalanceOnchain(partyId: string): Promise<number | null> {
  try {
    const partyBytes = toPartyBytes32(partyId);
    const data = await publicMonadClient.readContract({
      address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      abi: PartyTreasuryABI,
      functionName: 'getParty',
      args: [partyBytes],
    });
    // getParty returns: [host, balance, totalDeposited, totalDistributed, exists]
    if (data && data[4]) {
      return Number(formatEther(data[1]));
    }
    return null;
  } catch (err) {
    console.warn('Could not read onchain pot balance:', err);
    return null;
  }
}

/**
 * Registers a party onchain in PartyTreasury.sol via server relayer.
 */
export async function registerPartyOnchain(
  partyId: string,
  hostAddress?: string
): Promise<{ success: boolean; txHash?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/treasury/action', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'register',
        partyId,
        recipientAddress: hostAddress,
      }),
    });
    return await res.json();
  } catch {
    return { success: false };
  }
}

