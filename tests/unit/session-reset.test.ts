import { describe, it, expect, beforeEach } from 'vitest';
import { usePartyStore } from '@/store/usePartyStore';
import type { Party, Expense, PotTransaction } from '@/types';

describe('User Session Reset & Data Isolation (Stage 3)', () => {
  beforeEach(() => {
    // Reset store to known state
    usePartyStore.getState().resetToDefaults();
  });

  it('completely purges private parties, finances, and activities on resetUserSession', () => {
    // Simulate logged in user with private data
    const mockParty: Party = {
      id: 'party-secret',
      code: 'SECR',
      title: 'Secret Gathering',
      date: '2026-10-10',
      time: '21:00',
      location: 'Private Location',
      description: 'Private',
      coverImage: 'cover.jpg',
      hostId: 'user-alice',
      hostName: 'Alice',
      members: [],
      potBalance: 150,
      createdAt: new Date().toISOString(),
      status: 'upcoming',
    };

    const mockExpense: Expense = {
      id: 'exp-1',
      partyId: 'party-secret',
      description: 'Cocktails',
      amount: 100,
      paidById: 'user-alice',
      paidByName: 'Alice',
      paidByAvatar: '',
      splitBetweenIds: ['user-alice'],
      createdAt: new Date().toISOString(),
    };

    const mockTx: PotTransaction = {
      id: 'tx-1',
      partyId: 'party-secret',
      amount: 50,
      type: 'add',
      description: 'Pot contribution',
      userName: 'Alice',
      userAvatar: '',
      timestamp: 'Just now',
    };

    // Populate store
    usePartyStore.setState({
      currentUser: {
        id: 'user-alice',
        name: 'Alice',
        handle: '@alice',
        avatar: 'alice.png',
        gatheringsCount: 5,
        gamesCount: 2,
        peopleCount: 10,
        settlementsCount: 3,
        balance: 100,
        isPrivyAuthenticated: true,
      },
      currentView: 'home',
      currentPartyId: 'party-secret',
      parties: [mockParty],
      expenses: [mockExpense],
      transactions: [mockTx],
      activities: [
        {
          id: 'act-1',
          partyId: 'party-secret',
          type: 'pot',
          text: 'Deposit of 50 USDC',
          time: 'Just now',
          avatar: '',
        },
      ],
      theme: 'dark',
      language: 'es',
    });

    // Verify initial populated state
    expect(usePartyStore.getState().parties).toHaveLength(1);
    expect(usePartyStore.getState().expenses).toHaveLength(1);
    expect(usePartyStore.getState().transactions).toHaveLength(1);
    expect(usePartyStore.getState().currentPartyId).toBe('party-secret');

    // Trigger logout / session reset
    usePartyStore.getState().resetUserSession();

    const afterReset = usePartyStore.getState();

    // Verify all private/group data is purged
    expect(afterReset.currentUser.isPrivyAuthenticated).toBe(false);
    expect(afterReset.currentUser.id).toBe('');
    expect(afterReset.currentUser.name).toBe('Guest');
    expect(afterReset.currentView).toBe('splash');
    expect(afterReset.currentPartyId).toBe('');
    expect(afterReset.currentCrewId).toBeNull();
    expect(afterReset.parties).toEqual([]);
    expect(afterReset.expenses).toEqual([]);
    expect(afterReset.transactions).toEqual([]);
    expect(afterReset.activities).toEqual([]);
    expect(afterReset.tasks).toEqual([]);
    expect(afterReset.polls).toEqual([]);
    expect(afterReset.memories).toEqual([]);

    // Verify user device preferences are preserved
    expect(afterReset.theme).toBe('dark');
    expect(afterReset.language).toBe('es');
  });
});
