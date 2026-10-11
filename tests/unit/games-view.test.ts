import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePartyStore } from '@/store/usePartyStore';
import * as treasuryService from '@/services/treasury';
import type { Party, Member } from '@/types';

describe('Games View & Onchain Reward Winner Integration (Objective 2)', () => {
  const mockMember1: Member = {
    id: 'user-winner-1',
    name: 'Sofia Winner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    walletAddress: '0x1111111111111111111111111111111111111111',
  };

  const mockMember2: Member = {
    id: 'user-player-2',
    name: 'Carlos RunnerUp',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    walletAddress: '0x2222222222222222222222222222222222222222',
  };

  const mockParty: Party = {
    id: 'party-games-test',
    code: 'GAME123',
    title: 'Rooftop Game Night',
    date: '2026-10-15',
    time: '21:00',
    location: 'Rooftop Lounge',
    description: 'Games and fun with the crew',
    coverImage: '',
    hostId: 'host-1',
    hostName: 'Host Admin',
    members: [mockMember1, mockMember2],
    potBalance: 25.5,
    createdAt: new Date().toISOString(),
    status: 'upcoming',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    usePartyStore.setState({
      parties: [mockParty],
      currentPartyId: 'party-games-test',
      activeGameId: 'whos-most-likely',
      transactions: [],
      activities: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows switching between minigames cleanly', () => {
    const store = usePartyStore.getState();
    expect(store.activeGameId).toBe('whos-most-likely');

    store.setActiveGame('this-or-that');
    expect(usePartyStore.getState().activeGameId).toBe('this-or-that');

    store.setActiveGame('crew-trivia');
    expect(usePartyStore.getState().activeGameId).toBe('crew-trivia');
  });

  it('distributes onchain bounty to game winner and updates store transactions and activities', async () => {
    const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    vi.spyOn(treasuryService, 'distributeBountyOnchain').mockResolvedValueOnce({
      success: true,
      txHash: mockTxHash,
      blockNumber: 77000,
      explorerUrl: `https://testnet.monadexplorer.com/tx/${mockTxHash}`,
      amount: 0.5,
      token: 'MON',
      network: 'Monad Testnet',
    });

    const result = await usePartyStore.getState().rewardGameWinner({
      partyId: 'party-games-test',
      memberId: 'user-winner-1',
      amount: 0.5,
      gameTitle: 'Crew Trivia',
    });

    expect(result.receipt?.txHash).toBe(mockTxHash);

    const state = usePartyStore.getState();
    // Transaction must be recorded
    const rewardTx = state.transactions.find((tx) => tx.type === 'reward');
    expect(rewardTx).toBeDefined();
    expect(rewardTx?.amount).toBe(0.5);
    expect(rewardTx?.userName).toBe('Sofia Winner');
    expect(rewardTx?.txHash).toBe(mockTxHash);

    // Activity must be recorded
    const gameActivity = state.activities.find((act) => act.type === 'game');
    expect(gameActivity).toBeDefined();
    expect(gameActivity?.text).toContain('Sofia Winner');
    expect(gameActivity?.text).toContain('0.50 MON');
  });

  it('handles fallback gracefully when onchain service encounters an error', async () => {
    vi.spyOn(treasuryService, 'distributeBountyOnchain').mockRejectedValueOnce(
      new Error('Monad RPC simulated error')
    );

    const result = await usePartyStore.getState().rewardGameWinner({
      partyId: 'party-games-test',
      memberId: 'user-winner-1',
      amount: 0.25,
      gameTitle: 'Who is Most Likely',
    });

    expect(result.status).toBe('available');

    const state = usePartyStore.getState();
    const rewardTx = state.transactions.find((tx) => tx.type === 'reward');
    expect(rewardTx).toBeDefined();
    expect(rewardTx?.amount).toBe(0.25);
  });
});
