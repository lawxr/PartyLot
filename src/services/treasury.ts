import type { DebtSettlement, PotTransaction } from '@/types';
import { createWalletClient, custom, parseEther, formatEther } from 'viem';
import { monadTestnet, publicMonadClient, getMonadExplorerTxUrl, toPartyBytes32 } from '@/lib/web3/monad';
import { MONAD_CONTRACT_ADDRESSES, PartyTreasuryABI } from '@/contracts';

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

    // Ensure the party is registered onchain in PartyTreasury before user deposits
    try {
      await fetch('/api/treasury/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await fetch('/api/treasury/record-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      `Para liquidar en Monad, cada acreedor debe tener una billetera verificada (0x...). Los siguientes participantes aún no la tienen: ${unverified.map((u) => u.toName || u.toId).join(', ')}.`
    );
  }

  // Prevent multi-debt pooling to a single arbitrary recipient
  if (settlements.length > 1) {
    throw new Error(
      'La liquidación agrupada a un solo destinatario está deshabilitada por seguridad contable. Cada deuda debe ser liquidada individualmente a la billetera de su acreedor.'
    );
  }

  const s = settlements[0];
  const res = await fetch('/api/treasury/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'settle',
      partyId,
      amount: s.amount,
      userAddress,
      recipientAddress: s.toId,
      description: `Settlement of debt to ${s.toName || s.toId} (${s.amount.toFixed(4)} MON)`,
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
    amount: s.amount,
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
    const res = await fetch('/api/treasury/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

