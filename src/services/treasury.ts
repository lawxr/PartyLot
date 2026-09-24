import type { DebtSettlement, PotTransaction } from '@/types';

export const FINANCIAL_ACTIONS_AVAILABLE = false as const;

export type FinancialActionResult = {
  status: 'unavailable';
  code: 'financial-provider-not-configured';
  message: string;
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
    ? 'Los pagos, retiros, recompensas y liquidaciones no están disponibles. No se ha movido dinero ni cambiado ningún saldo.'
    : 'Payments, spending, rewards, and settlements are unavailable. No money has moved and no balances have changed.';
}

export function getFinancialActionUnavailableResult(
  language: 'en' | 'es' = 'en'
): FinancialActionResult {
  return {
    status: 'unavailable',
    code: 'financial-provider-not-configured',
    message: getFinancialActionsUnavailableMessage(language),
  };
}

export class TreasuryUnavailableError extends Error {
  constructor() {
    super('Financial actions are unavailable until a real payment service is configured.');
    this.name = 'TreasuryUnavailableError';
  }
}

function rejectUnavailable(): never {
  throw new TreasuryUnavailableError();
}

/** Financial integrations are intentionally unavailable until a real provider exists. */
export async function depositToPartyPotOnchain(
  _partyId: string,
  _amount: number,
  _userAddress?: string
): Promise<never> {
  void _partyId;
  void _amount;
  void _userAddress;
  return rejectUnavailable();
}

export async function distributeBountyOnchain(
  _partyId: string,
  _recipientAddress: string,
  _amount: number,
  _role: string
): Promise<never> {
  void _partyId;
  void _recipientAddress;
  void _amount;
  void _role;
  return rejectUnavailable();
}

export async function settleDamageOnchain(
  _partyId: string,
  _settlements: DebtSettlement[]
): Promise<never> {
  void _partyId;
  void _settlements;
  return rejectUnavailable();
}

export async function rolloverFundsOnchain(
  _fromTreasury: string,
  _nextPartyId: string,
  _amount: number
): Promise<never> {
  void _fromTreasury;
  void _nextPartyId;
  void _amount;
  return rejectUnavailable();
}
