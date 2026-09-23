import { PotTransaction } from '@/types';

export function calculateTotalContributed(transactions: PotTransaction[]): number {
  return transactions
    .filter(t => t.type === 'add')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalSpent(transactions: PotTransaction[]): number {
  return transactions
    .filter(t => t.type === 'spend')
    .reduce((sum, t) => sum + t.amount, 0);
}
