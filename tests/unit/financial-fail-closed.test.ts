import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePartyStore } from '@/store/usePartyStore';
import * as treasuryService from '@/services/treasury';
import type { Party, Expense } from '@/types';

describe('Financial Actions Fail-Closed (Stage 3)', () => {
  const mockParty: Party = {
    id: 'party-test-1',
    code: 'TEST',
    title: 'Test Party',
    date: '2026-10-10',
    time: '20:00',
    location: 'Test Location',
    description: 'Test',
    coverImage: '',
    hostId: 'host-1',
    hostName: 'Host',
    members: [
      { id: 'u1', name: 'Alice', avatar: '' },
      { id: 'u2', name: 'Bob', avatar: '' },
    ],
    potBalance: 100,
    createdAt: new Date().toISOString(),
    status: 'upcoming',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    usePartyStore.setState({
      parties: [mockParty],
      currentPartyId: 'party-test-1',
      transactions: [],
      activities: [],
      expenses: [],
    });
  });

  it('fails closed when deposit fails: does not alter balance or record fake transaction', async () => {
    vi.spyOn(treasuryService, 'depositToPartyPotOnchain').mockRejectedValueOnce(
      new Error('Monad RPC connection timeout')
    );

    await expect(
      usePartyStore.getState().addToPot('party-test-1', 50, 'Failed deposit')
    ).rejects.toThrow('Monad RPC connection timeout');

    const state = usePartyStore.getState();
    const party = state.parties.find((p) => p.id === 'party-test-1');

    // Pot balance must remain unchanged ($100, NOT $150)
    expect(party?.potBalance).toBe(100);
    // No transaction should be recorded
    expect(state.transactions).toHaveLength(0);
    // No celebratory activity should be recorded
    expect(state.activities).toHaveLength(0);
  });

  it('fails closed when spend fails: does not deduct balance or record fake transaction', async () => {
    vi.spyOn(treasuryService, 'distributeBountyOnchain').mockRejectedValueOnce(
      new Error('Insufficient Monad treasury balance')
    );

    await expect(
      usePartyStore.getState().spendFromPot('party-test-1', 40, 'Failed spend')
    ).rejects.toThrow('Insufficient Monad treasury balance');

    const state = usePartyStore.getState();
    const party = state.parties.find((p) => p.id === 'party-test-1');

    // Pot balance must remain unchanged ($100, NOT $60)
    expect(party?.potBalance).toBe(100);
    expect(state.transactions).toHaveLength(0);
    expect(state.activities).toHaveLength(0);
  });

  it('fails closed when debt settlement fails: does not mark expenses as settled', async () => {
    const unsettledExpense: Expense = {
      id: 'exp-1',
      partyId: 'party-test-1',
      description: 'Dinner',
      amount: 60,
      paidById: 'u1',
      paidByName: 'Alice',
      paidByAvatar: '',
      splitBetweenIds: ['u1', 'u2'],
      createdAt: new Date().toISOString(),
      isSettled: false,
    };

    usePartyStore.setState({
      expenses: [unsettledExpense],
    });

    vi.spyOn(treasuryService, 'settleDamageOnchain').mockRejectedValueOnce(
      new Error('Transaction reverted on Monad')
    );

    await expect(
      usePartyStore.getState().settleAllDebts('party-test-1')
    ).rejects.toThrow('Transaction reverted on Monad');

    const state = usePartyStore.getState();
    const expense = state.expenses.find((e) => e.id === 'exp-1');

    // Expense must NOT be marked as settled
    expect(expense?.isSettled).toBe(false);
    expect(state.activities).toHaveLength(0);
  });
});
