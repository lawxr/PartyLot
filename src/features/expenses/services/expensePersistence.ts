import { getSupabase } from '@/lib/supabase/client';
import type { Expense } from '../types';

/**
 * Persists an expense added to a party in Supabase PostgreSQL
 */
export async function persistExpenseToSupabase(expense: Expense): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('expenses').upsert({
      id: expense.id,
      party_id: expense.partyId,
      description: expense.description,
      amount: expense.amount,
      paid_by_id: expense.paidById,
      paid_by_name: expense.paidByName,
      split_between_ids: expense.splitBetweenIds,
      category: expense.category || 'general',
      is_settled: expense.isSettled || false,
      tx_hash: expense.txHash || null,
    });
  } catch (err) {
    console.warn('Failed to persist expense:', err);
  }
}
