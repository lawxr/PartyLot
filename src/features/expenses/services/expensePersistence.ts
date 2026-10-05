import { getClientPrivyToken } from '@/hooks/usePrivySync';
import type { Expense } from '../types';

/**
 * Persists an expense added to a party via the secure backend API route
 */
export async function persistExpenseToSupabase(expense: Expense): Promise<void> {
  try {
    const token = await getClientPrivyToken();
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
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Backend expense persistence warning:', errData);
    }
  } catch (err) {
    console.warn('Failed to persist expense via API:', err);
  }
}
