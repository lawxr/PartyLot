import { PotTransaction, DebtSettlement } from '@/types';
import { executeSponsoredUserOp, getOrCreateSmartAccount } from '@/lib/web3/smartAccount';
import { simulateTreasuryCall } from '@/lib/web3/metropolis';
import { MONAD_CONTRACT_ADDRESSES } from '@/contracts';
import { getMonadExplorerTxUrl } from '@/lib/web3/monad';

export function calculateTotalContributed(transactions: PotTransaction[]): number {
  return transactions
    .filter((t) => t.type === 'add')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalSpent(transactions: PotTransaction[]): number {
  return transactions
    .filter((t) => t.type === 'spend')
    .reduce((sum, t) => sum + t.amount, 0);
}

export interface TreasuryExecutionReceipt {
  success: boolean;
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
  amount: number;
  method: string;
}

/**
 * Deposits funds into the PartyTreasury smart contract on Monad Testnet.
 * Uses Pimlico sponsored ERC-4337 UserOp for 0-gas execution.
 */
export async function depositToPartyPotOnchain(
  partyId: string,
  amount: number,
  userAddress?: string
): Promise<TreasuryExecutionReceipt> {
  const account = getOrCreateSmartAccount();
  const sender = userAddress || account.address;

  // 1. Simulate on Tenderly Pro for instant pre-flight validation
  await simulateTreasuryCall(
    MONAD_CONTRACT_ADDRESSES.partyTreasury,
    'deposit',
    { partyId, sender, amount }
  );

  // 2. Execute via Pimlico ERC-4337 Sponsored Account Abstraction
  const userOpReceipt = await executeSponsoredUserOp(sender, [
    {
      to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      value: amount,
      label: `PartyPot.deposit(${partyId}, $${amount})`,
    },
  ]);

  return {
    success: userOpReceipt.success,
    txHash: userOpReceipt.transactionHash,
    blockNumber: userOpReceipt.blockNumber,
    explorerUrl: getMonadExplorerTxUrl(userOpReceipt.transactionHash),
    amount,
    method: 'deposit',
  };
}

/**
 * Distributes an economic reward / bounty directly from the Party Pot to a member.
 */
export async function distributeBountyOnchain(
  partyId: string,
  recipientAddress: string,
  amount: number,
  role: string
): Promise<TreasuryExecutionReceipt> {
  const account = getOrCreateSmartAccount();

  await simulateTreasuryCall(
    MONAD_CONTRACT_ADDRESSES.partyTreasury,
    'distributeReward',
    { partyId, recipient: recipientAddress, amount, role }
  );

  const userOpReceipt = await executeSponsoredUserOp(account.address, [
    {
      to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      value: 0,
      label: `PartyTreasury.distributeReward(${recipientAddress}, $${amount}, "${role}")`,
    },
  ]);

  return {
    success: userOpReceipt.success,
    txHash: userOpReceipt.transactionHash,
    blockNumber: userOpReceipt.blockNumber,
    explorerUrl: getMonadExplorerTxUrl(userOpReceipt.transactionHash),
    amount,
    method: 'distributeReward',
  };
}

/**
 * Settles debts among gathering participants in a single batch on Monad.
 */
export async function settleDamageOnchain(
  partyId: string,
  settlements: DebtSettlement[]
): Promise<TreasuryExecutionReceipt> {
  const account = getOrCreateSmartAccount();
  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);

  await simulateTreasuryCall(
    MONAD_CONTRACT_ADDRESSES.partyTreasury,
    'settleDebts',
    { partyId, settlementsCount: settlements.length, totalAmount }
  );

  const userOpReceipt = await executeSponsoredUserOp(account.address, [
    {
      to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      value: 0,
      label: `SettlementEngine.settleDebts(${partyId}, ${settlements.length} transfers)`,
    },
  ]);

  return {
    success: userOpReceipt.success,
    txHash: userOpReceipt.transactionHash,
    blockNumber: userOpReceipt.blockNumber,
    explorerUrl: getMonadExplorerTxUrl(userOpReceipt.transactionHash),
    amount: totalAmount,
    method: 'settleDebts',
  };
}

/**
 * Rolls over remaining Party Pot funds to the Crew Treasury contract for future gatherings.
 */
export async function rolloverFundsOnchain(
  fromTreasury: string,
  nextPartyId: string,
  amount: number
): Promise<TreasuryExecutionReceipt> {
  const account = getOrCreateSmartAccount();

  await simulateTreasuryCall(
    MONAD_CONTRACT_ADDRESSES.partyTreasury,
    'rolloverToNextParty',
    { fromTreasury, nextPartyId, amount }
  );

  const userOpReceipt = await executeSponsoredUserOp(account.address, [
    {
      to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      value: 0,
      label: `PartyTreasury.rolloverToNextParty(${nextPartyId}, $${amount})`,
    },
  ]);

  return {
    success: userOpReceipt.success,
    txHash: userOpReceipt.transactionHash,
    blockNumber: userOpReceipt.blockNumber,
    explorerUrl: getMonadExplorerTxUrl(userOpReceipt.transactionHash),
    amount,
    method: 'rolloverToNextParty',
  };
}
