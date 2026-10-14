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

  it('correctly models 4-way split and ensures debt settlement clears balance without inflating expense spend', () => {
    const groupMembers: Member[] = [
      { id: 'jordi', name: 'Jordi', avatar: 'jordi.jpg' },
      { id: 'user', name: 'User', avatar: 'user.jpg' },
      { id: 'charlie', name: 'Charlie', avatar: 'charlie.jpg' },
      { id: 'diana', name: 'Diana', avatar: 'diana.jpg' },
    ];

    // Jordi paid $5.00 split 4 ways ($1.25 each)
    const initialExpense: Expense = {
      id: 'e-jordi-5',
      partyId: 'p1',
      description: 'Drinks for group',
      amount: 5,
      paidById: 'jordi',
      paidByName: 'Jordi',
      paidByAvatar: 'jordi.jpg',
      splitBetweenIds: ['jordi', 'user', 'charlie', 'diana'],
      createdAt: '2026-10-01',
      isSettled: false,
    };

    const initialBalances = calculateNetBalances([initialExpense], groupMembers);
    const initialSettlements = computeDebtSettlements(initialBalances, groupMembers);

    expect(initialBalances.find((b) => b.memberId === 'jordi')?.netAmount).toBe(3.75);
    expect(initialBalances.find((b) => b.memberId === 'user')?.netAmount).toBe(-1.25);
    expect(initialSettlements).toHaveLength(3);
    expect(initialSettlements).toContainEqual(
      expect.objectContaining({ fromId: 'user', toId: 'jordi', amount: 1.25 })
    );

    // User settles $1.25 with Jordi
    const settlementTransfer: Expense = {
      id: 'settle-tx-1',
      partyId: 'p1',
      description: 'Settlement: User paid Jordi (MON)',
      amount: 1.25,
      paidById: 'user',
      paidByName: 'User',
      paidByAvatar: 'user.jpg',
      splitBetweenIds: ['jordi'],
      createdAt: '2026-10-01',
      isSettled: false,
      isSettlement: true,
    };

    const allExpenses = [initialExpense, settlementTransfer];

    // Actual shared party spend MUST exclude settlement debt transfers
    const actualSpend = allExpenses
      .filter((e) => !e.isSettlement && !e.id.startsWith('settle-'))
      .reduce((sum, e) => sum + e.amount, 0);
    expect(actualSpend).toBe(5); // Stays $5.00, NEVER $6.25!

    // Balance recalculation: User is completely cleared (0 debt)
    const postSettlementBalances = calculateNetBalances(allExpenses, groupMembers);
    const userBalance = postSettlementBalances.find((b) => b.memberId === 'user')?.netAmount;
    const jordiBalance = postSettlementBalances.find((b) => b.memberId === 'jordi')?.netAmount;

    expect(userBalance).toBe(0);
    expect(jordiBalance).toBe(2.5); // Remaining from Charlie and Diana

    const remainingSettlements = computeDebtSettlements(postSettlementBalances, groupMembers);
    expect(remainingSettlements).toHaveLength(2);
    expect(remainingSettlements.some((s) => s.fromId === 'user')).toBe(false);
  });
});
