import { describe, it, expect } from 'vitest';
import { calculateNetBalances, computeDebtSettlements } from '@/services/settlements';
import type { Expense, Member, NetBalance } from '@/types';

describe('Settlements Service', () => {
  const mockMembers: Member[] = [
    { id: 'u1', name: 'Alice', avatar: 'alice.png' },
    { id: 'u2', name: 'Bob', avatar: 'bob.png' },
    { id: 'u3', name: 'Charlie', avatar: 'charlie.png' },
    { id: 'u4', name: 'Diana', avatar: 'diana.png' },
  ];

  describe('calculateNetBalances', () => {
    it('returns zero balances when there are no expenses', () => {
      const balances = calculateNetBalances([], mockMembers);

      expect(balances).toHaveLength(4);
      balances.forEach((b) => {
        expect(b.netAmount).toBe(0);
      });
    });

    it('correctly calculates balances for a single expense split equally', () => {
      // Alice pays $60 split equally between Alice, Bob, and Charlie ($20 each)
      const expenses: Expense[] = [
        {
          id: 'e1',
          partyId: 'p1',
          description: 'Drinks',
          amount: 60,
          paidById: 'u1',
          paidByName: 'Alice',
          paidByAvatar: 'alice.png',
          splitBetweenIds: ['u1', 'u2', 'u3'],
          createdAt: new Date().toISOString(),
        },
      ];

      const balances = calculateNetBalances(expenses, mockMembers);
      const balanceMap = Object.fromEntries(balances.map((b) => [b.memberId, b.netAmount]));

      // Alice paid 60, consumed 20 -> net +40
      expect(balanceMap['u1']).toBe(40);
      // Bob consumed 20 -> net -20
      expect(balanceMap['u2']).toBe(-20);
      // Charlie consumed 20 -> net -20
      expect(balanceMap['u3']).toBe(-20);
      // Diana was not in the split -> net 0
      expect(balanceMap['u4']).toBe(0);

      // Invariant: sum of net amounts must equal 0
      const sum = balances.reduce((acc, b) => acc + b.netAmount, 0);
      expect(sum).toBe(0);
    });

    it('correctly aggregates multiple expenses from different payers', () => {
      // Expense 1: Alice pays $90 for Alice, Bob, Charlie ($30 each)
      // Expense 2: Bob pays $40 for Bob and Diana ($20 each)
      const expenses: Expense[] = [
        {
          id: 'e1',
          partyId: 'p1',
          description: 'Dinner',
          amount: 90,
          paidById: 'u1',
          paidByName: 'Alice',
          paidByAvatar: 'alice.png',
          splitBetweenIds: ['u1', 'u2', 'u3'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'e2',
          partyId: 'p1',
          description: 'Taxi',
          amount: 40,
          paidById: 'u2',
          paidByName: 'Bob',
          paidByAvatar: 'bob.png',
          splitBetweenIds: ['u2', 'u4'],
          createdAt: new Date().toISOString(),
        },
      ];

      const balances = calculateNetBalances(expenses, mockMembers);
      const balanceMap = Object.fromEntries(balances.map((b) => [b.memberId, b.netAmount]));

      // Alice: +90 - 30 = +60
      expect(balanceMap['u1']).toBe(60);
      // Bob: -30 + 40 - 20 = -10
      expect(balanceMap['u2']).toBe(-10);
      // Charlie: -30
      expect(balanceMap['u3']).toBe(-30);
      // Diana: -20
      expect(balanceMap['u4']).toBe(-20);

      const sum = balances.reduce((acc, b) => acc + b.netAmount, 0);
      expect(sum).toBe(0);
    });

    it('ignores settled expenses', () => {
      const expenses: Expense[] = [
        {
          id: 'e1',
          partyId: 'p1',
          description: 'Settled Pizza',
          amount: 50,
          paidById: 'u1',
          paidByName: 'Alice',
          paidByAvatar: 'alice.png',
          splitBetweenIds: ['u1', 'u2'],
          createdAt: new Date().toISOString(),
          isSettled: true,
        },
      ];

      const balances = calculateNetBalances(expenses, mockMembers);
      balances.forEach((b) => {
        expect(b.netAmount).toBe(0);
      });
    });

    it('ignores expenses with empty split participant list', () => {
      const expenses: Expense[] = [
        {
          id: 'e1',
          partyId: 'p1',
          description: 'Invalid split',
          amount: 50,
          paidById: 'u1',
          paidByName: 'Alice',
          paidByAvatar: 'alice.png',
          splitBetweenIds: [],
          createdAt: new Date().toISOString(),
        },
      ];

      const balances = calculateNetBalances(expenses, mockMembers);
      balances.forEach((b) => {
        expect(b.netAmount).toBe(0);
      });
    });

    it('correctly rounds decimals to two decimal places', () => {
      // $100 split 3 ways is $33.3333... each
      const expenses: Expense[] = [
        {
          id: 'e1',
          partyId: 'p1',
          description: 'Three way split',
          amount: 100,
          paidById: 'u1',
          paidByName: 'Alice',
          paidByAvatar: 'alice.png',
          splitBetweenIds: ['u1', 'u2', 'u3'],
          createdAt: new Date().toISOString(),
        },
      ];

      const balances = calculateNetBalances(expenses, mockMembers.slice(0, 3));
      const balanceMap = Object.fromEntries(balances.map((b) => [b.memberId, b.netAmount]));

      // Alice: 100 - 33.3333... = 66.67
      expect(balanceMap['u1']).toBe(66.67);
      // Bob: -33.33
      expect(balanceMap['u2']).toBe(-33.33);
      // Charlie: -33.33
      expect(balanceMap['u3']).toBe(-33.33);
    });
  });

  describe('computeDebtSettlements', () => {
    it('returns no settlements when all net balances are zero', () => {
      const netBalances: NetBalance[] = [
        { memberId: 'u1', memberName: 'Alice', avatar: 'alice.png', netAmount: 0 },
        { memberId: 'u2', memberName: 'Bob', avatar: 'bob.png', netAmount: 0 },
      ];

      const settlements = computeDebtSettlements(netBalances, mockMembers);
      expect(settlements).toEqual([]);
    });

    it('settles simple direct debt between two members', () => {
      const netBalances: NetBalance[] = [
        { memberId: 'u1', memberName: 'Alice', avatar: 'alice.png', netAmount: 25 },
        { memberId: 'u2', memberName: 'Bob', avatar: 'bob.png', netAmount: -25 },
      ];

      const settlements = computeDebtSettlements(netBalances, mockMembers);
      expect(settlements).toHaveLength(1);
      expect(settlements[0]).toEqual({
        fromId: 'u2',
        fromName: 'Bob',
        fromAvatar: 'bob.png',
        toId: 'u1',
        toName: 'Alice',
        toAvatar: 'alice.png',
        amount: 25,
      });
    });

    it('minimizes transaction count in multi-creditor multi-debtor group', () => {
      // Alice is owed 50, Bob is owed 30.
      // Charlie owes 40, Diana owes 40.
      // Total owed = 80, Total debt = 80.
      const netBalances: NetBalance[] = [
        { memberId: 'u1', memberName: 'Alice', avatar: 'alice.png', netAmount: 50 },
        { memberId: 'u2', memberName: 'Bob', avatar: 'bob.png', netAmount: 30 },
        { memberId: 'u3', memberName: 'Charlie', avatar: 'charlie.png', netAmount: -40 },
        { memberId: 'u4', memberName: 'Diana', avatar: 'diana.png', netAmount: -40 },
      ];

      const settlements = computeDebtSettlements(netBalances, mockMembers);

      // Verify that total settled amount equals total debt (80)
      const totalSettled = settlements.reduce((acc, s) => acc + s.amount, 0);
      expect(totalSettled).toBe(80);

      // Greedy algorithm minimizes transactions: should settle in at most 3 transactions
      expect(settlements.length).toBeLessThanOrEqual(3);

      // Verify each individual's settled payments and receipts
      const received: Record<string, number> = {};
      const paid: Record<string, number> = {};

      settlements.forEach((s) => {
        paid[s.fromId] = (paid[s.fromId] || 0) + s.amount;
        received[s.toId] = (received[s.toId] || 0) + s.amount;
      });

      expect(received['u1']).toBe(50);
      expect(received['u2']).toBe(30);
      expect(paid['u3']).toBe(40);
      expect(paid['u4']).toBe(40);
    });

    it('ignores amounts within dust tolerance (< 0.01)', () => {
      const netBalances: NetBalance[] = [
        { memberId: 'u1', memberName: 'Alice', avatar: 'alice.png', netAmount: 0.004 },
        { memberId: 'u2', memberName: 'Bob', avatar: 'bob.png', netAmount: -0.004 },
      ];

      const settlements = computeDebtSettlements(netBalances, mockMembers);
      expect(settlements).toHaveLength(0);
    });

    it('falls back gracefully when member info is missing in member map', () => {
      const netBalances: NetBalance[] = [
        { memberId: 'unknown_creditor', memberName: 'Ghost1', avatar: '', netAmount: 15 },
        { memberId: 'unknown_debtor', memberName: 'Ghost2', avatar: '', netAmount: -15 },
      ];

      const settlements = computeDebtSettlements(netBalances, []);
      expect(settlements).toHaveLength(1);
      expect(settlements[0].fromName).toBe('Guest');
      expect(settlements[0].toName).toBe('Guest');
      expect(settlements[0].amount).toBe(15);
    });
  });
});
