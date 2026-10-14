import { getClientPrivyToken } from '@/hooks/usePrivySync';
import type { Expense } from '../types';

/**
 * Persists an expense added to a party via the secure backend API route
 */
export async function persistExpenseToSupabase(expense: Expense): Promise<void> {
  const token = await getClientPrivyToken().catch(() => null);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: expense.id,
      partyId: expense.partyId,
      description: expense.description,
      amount: expense.amount,
      paidById: expense.paidById,
      paidByName: expense.paidByName,
      splitBetweenIds: expense.splitBetweenIds,
      category: expense.category || 'general',
      isSettlement: Boolean(expense.isSettlement),
      txHash: expense.txHash || null,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.message || errData.error || `HTTP ${res.status}: Failed to persist expense`;
    console.warn('Backend expense persistence warning:', errData);
    throw new Error(message);
  }
}

