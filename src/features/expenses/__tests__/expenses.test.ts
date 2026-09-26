import { describe, it, expect } from 'vitest';
import {
  calculateNetBalances,
  computeDebtSettlements,
  persistExpenseToSupabase,
} from '@/features/expenses';
import type { Member, Expense } from '@/features/expenses';

describe('features/expenses Domain Module', () => {
  const members: Member[] = [
    { id: 'm1', name: 'Elena', avatar: 'elena.jpg' },
    { id: 'm2', name: 'Mateo', avatar: 'mateo.jpg' },
  ];

  it('exports calculateNetBalances that accurately calculates split shares', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        partyId: 'p1',
        description: 'Snacks',
        amount: 30,
        paidById: 'm1',
        paidByName: 'Elena',
        paidByAvatar: '',
        splitBetweenIds: ['m1', 'm2'],
        createdAt: '2026-10-01',
      },
    ];

    const balances = calculateNetBalances(expenses, members);
    expect(balances).toHaveLength(2);

    const elena = balances.find((b) => b.memberId === 'm1');
    const mateo = balances.find((b) => b.memberId === 'm2');

    expect(elena?.netAmount).toBe(15);
    expect(mateo?.netAmount).toBe(-15);
  });

  it('exports computeDebtSettlements that produces matching transfers', () => {
    const balances = [
      { memberId: 'm1', memberName: 'Elena', avatar: '', netAmount: 15 },
      { memberId: 'm2', memberName: 'Mateo', avatar: '', netAmount: -15 },
    ];

    const settlements = computeDebtSettlements(balances, members);
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({
      fromId: 'm2',
      fromName: 'Mateo',
      fromAvatar: 'mateo.jpg',
      toId: 'm1',
      toName: 'Elena',
      toAvatar: 'elena.jpg',
      amount: 15,
    });
  });

  it('exports persistExpenseToSupabase function', () => {
    expect(typeof persistExpenseToSupabase).toBe('function');
  });
});
