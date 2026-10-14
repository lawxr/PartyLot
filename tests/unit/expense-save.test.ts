import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Party } from '@/types';

const mocks = vi.hoisted(() => ({
  persistExpenseToSupabase: vi.fn(),
}));

vi.mock('@/services/supabaseService', () => ({
  persistPartyToSupabase: vi.fn(),
  persistActivityToSupabase: vi.fn(),
  persistExpenseToSupabase: mocks.persistExpenseToSupabase,
  persistPotTransactionToSupabase: vi.fn(),
}));

import { usePartyStore } from '@/store/usePartyStore';

const party: Party = {
  id: 'party-expense-save',
  code: 'SAVE',
  title: 'Dinner',
  date: '2026-10-13',
  time: '19:00',
  location: 'Home',
  description: 'Dinner with friends',
  coverImage: '',
  hostId: 'alice',
  hostName: 'Alice',
  members: [
    { id: 'alice', name: 'Alice', avatar: '' },
    { id: 'bob', name: 'Bob', avatar: '' },
  ],
  potBalance: 0,
  createdAt: '2026-10-13T00:00:00.000Z',
  status: 'upcoming',
};

const expenseInput = {
  partyId: party.id,
  description: 'Dinner',
  amount: 1,
  paidById: 'alice',
  splitBetweenIds: ['alice', 'bob'],
};

describe('expense save validation and persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.persistExpenseToSupabase.mockResolvedValue(undefined);
    usePartyStore.setState({
      parties: [party],
      currentPartyId: party.id,
      expenses: [],
      activities: [],
    });
  });

  it('rejects a missing or non-party payer without recording an expense', async () => {
    const addExpense = usePartyStore.getState().addExpense;

    await expect(addExpense({ ...expenseInput, paidById: '' })).rejects.toThrow();
    await expect(addExpense({ ...expenseInput, paidById: 'outsider' })).rejects.toThrow();

    expect(mocks.persistExpenseToSupabase).not.toHaveBeenCalled();
    expect(usePartyStore.getState().expenses).toEqual([]);
  });

  it('rejects an empty or non-party split without recording an expense', async () => {
    const addExpense = usePartyStore.getState().addExpense;

    await expect(addExpense({ ...expenseInput, splitBetweenIds: [] })).rejects.toThrow();
    await expect(addExpense({ ...expenseInput, splitBetweenIds: ['outsider'] })).rejects.toThrow();

    expect(mocks.persistExpenseToSupabase).not.toHaveBeenCalled();
    expect(usePartyStore.getState().expenses).toEqual([]);
  });

  it('waits for persistence before recording the expense', async () => {
    let finishSave: (() => void) | undefined;
    mocks.persistExpenseToSupabase.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishSave = resolve;
      })
    );

    const save = usePartyStore.getState().addExpense(expenseInput);
    expect(usePartyStore.getState().expenses).toEqual([]);

    finishSave?.();
    await save;

    expect(usePartyStore.getState().expenses).toHaveLength(1);
  });

  it('does not record an expense when persistence rejects', async () => {
    mocks.persistExpenseToSupabase.mockRejectedValueOnce(new Error('Save unavailable'));

    await expect(usePartyStore.getState().addExpense(expenseInput)).rejects.toThrow('Save unavailable');

    expect(usePartyStore.getState().expenses).toEqual([]);
    expect(usePartyStore.getState().activities).toEqual([]);
  });
});
