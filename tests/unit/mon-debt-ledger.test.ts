import { describe, expect, it, vi } from 'vitest';
import { calculateNetBalances, computeDebtSettlements } from '@/services/settlements';
import { persistExpenseToSupabase } from '@/features/expenses';
import type { Expense, Member, NetBalance } from '@/types';

describe('MON-02 — Reliable MON Debt Ledger', () => {
  const alice: Member = { id: 'u1', name: 'Alice', avatar: 'alice.png' };
  const bob: Member = { id: 'u2', name: 'Bob', avatar: 'bob.png' };
  const currentMembers: Member[] = [alice, bob];

  describe('Historical Participant Preservation & Conserved Allocations', () => {
    it('preserves historical participants in calculateNetBalances when a member was removed from party', () => {
      // Alice paid 60 MON split between Alice, Bob, and Charlie (u3).
      // Charlie was later removed from currentMembers.
      const expenses: Expense[] = [
        {
          id: 'e1',
          partyId: 'p1',
          description: 'Groceries (MON)',
          amount: 60,
          paidById: 'u1',
          paidByName: 'Alice',
          paidByAvatar: 'alice.png',
          splitBetweenIds: ['u1', 'u2', 'u3'],
          createdAt: new Date().toISOString(),
        },
      ];

      const balances = calculateNetBalances(expenses, currentMembers);
      const balanceMap = Object.fromEntries(balances.map((b) => [b.memberId, b.netAmount]));

      // Alice: paid 60, consumed 20 -> net +40
      expect(balanceMap['u1']).toBe(40);
      // Bob: consumed 20 -> net -20
      expect(balanceMap['u2']).toBe(-20);
      // Charlie (historical participant): consumed 20 -> net -20 must NOT be dropped!
      expect(balanceMap['u3']).toBe(-20);

      // Invariant: sum of all net amounts in the system must strictly conserve to 0
      const sum = balances.reduce((acc, b) => acc + b.netAmount, 0);
      expect(sum).toBe(0);
    });

    it('computeDebtSettlements computes settlement for historical participants not in currentMembers', () => {
      const netBalances: NetBalance[] = [
        { memberId: 'u1', memberName: 'Alice', avatar: 'alice.png', netAmount: 20 },
        { memberId: 'u3', memberName: 'Charlie', avatar: 'charlie.png', netAmount: -20 },
      ];

      // Charlie is not in currentMembers
      const settlements = computeDebtSettlements(netBalances, currentMembers);

      expect(settlements).toHaveLength(1);
      expect(settlements[0].fromId).toBe('u3');
      expect(settlements[0].toId).toBe('u1');
      expect(settlements[0].toName).toBe('Alice');
      expect(settlements[0].amount).toBe(20);
    });

    it('retains a removed participant who owes only one 0.0001 MON unit', () => {
      const expense: Expense = {
        id: 'e-former-member-dust',
        partyId: 'p1',
        description: 'Small shared expense',
        amount: 0.0001,
        paidById: 'u1',
        paidByName: 'Alice',
        paidByAvatar: 'alice.png',
        splitBetweenIds: ['u3', 'u1'],
        createdAt: new Date().toISOString(),
      };

      const balances = calculateNetBalances([expense], currentMembers);
      expect(balances.find((balance) => balance.memberId === 'u3')).toMatchObject({
        memberName: 'Former Member',
        netAmount: -0.0001,
      });
      expect(balances.reduce((sum, balance) => sum + Math.round(balance.netAmount * 10_000), 0)).toBe(0);
    });

    it('conserves allocations and settles correctly with fractional MON precision', () => {
      // 10 MON split equally between 3 people (3.3333... each)
      const expenses: Expense[] = [
        {
          id: 'e-split-3',
          partyId: 'p1',
          description: 'Pizza (MON)',
          amount: 10,
          paidById: 'u1',
          paidByName: 'Alice',
          paidByAvatar: 'alice.png',
          splitBetweenIds: ['u1', 'u2', 'u3'],
          createdAt: new Date().toISOString(),
        },
      ];

      const charlie: Member = { id: 'u3', name: 'Charlie', avatar: 'charlie.png' };
      const allMembers = [alice, bob, charlie];
      const balances = calculateNetBalances(expenses, allMembers);

      // Creditor gets paid back; debtor debts sum to total debt in 0.0001 MON units.
      const settlements = computeDebtSettlements(balances, allMembers);
      const totalSettled = settlements.reduce((acc, s) => acc + s.amount, 0);
      expect(Math.round(totalSettled * 10_000)).toBe(66_666);
    });
  });

  describe('Durable Receipt-Backed Settlement Records & API Sync', () => {
    it('persists settlement to backend with txHash and isSettlement and surfaces errors on failure', async () => {
      const settlementExpense: Expense = {
        id: 'settle-tx-0xabc123-u2',
        partyId: 'p1',
        description: 'Settlement: Bob paid Alice (MON)',
        amount: 20,
        paidById: 'u2',
        paidByName: 'Bob',
        paidByAvatar: 'bob.png',
        splitBetweenIds: ['u1'],
        createdAt: 'Just now',
        category: 'general',
        isSettled: false,
        isSettlement: true,
        txHash: '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'DATABASE_UNAVAILABLE', message: 'DB connection failure' }),
      });
      globalThis.fetch = fetchMock;

      // Must throw or reject when save fails so caller cannot claim false optimistic success
      await expect(persistExpenseToSupabase(settlementExpense)).rejects.toThrow();

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/expenses',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"isSettlement":true'),
        })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/expenses',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"txHash":"0xabc123'),
        })
      );
    });
  });
});
