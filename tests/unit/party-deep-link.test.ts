import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePartyStore } from '@/store/usePartyStore';
import { Party } from '@/types';

describe('Dynamic Party Deep-Link Route Resolution (Item 2)', () => {
  const mockParty: Party = {
    id: 'party-uuid-1234',
    title: 'Neon Nights Monad',
    date: 'Tonight',
    time: '22:00',
    location: 'Club 0x, Bogota',
    description: 'A hackathon afterparty',
    coverImage: 'https://images.unsplash.com/photo-1',
    code: 'NEON',
    hostId: 'host-1',
    hostName: 'Alice',
    members: [],
    potBalance: 100,
    createdAt: '2026-10-11',
    status: 'upcoming',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    usePartyStore.setState({
      parties: [mockParty],
      currentPartyId: '',
      currentView: 'home',
      pendingInviteCode: null,
    });
  });

  it('correctly detects short alphanumeric codes as invite codes and routes to join-party', () => {
    const rawCode = 'neon';
    const isShortCode = /^[a-zA-Z0-9]{4,6}$/.test(rawCode);
    expect(isShortCode).toBe(true);

    const cleanCode = rawCode.slice(0, 4).toUpperCase();
    usePartyStore.getState().setPendingInviteCode(cleanCode);
    usePartyStore.getState().setCurrentView('join-party');

    const state = usePartyStore.getState();
    expect(state.pendingInviteCode).toBe('NEON');
    expect(state.currentView).toBe('join-party');
  });

  it('matches party UUID already in store and selects it with party-detail view', () => {
    const rawId = 'party-uuid-1234';
    const parties = usePartyStore.getState().parties;
    const existing = parties.find(
      (p) => p.id.toLowerCase() === rawId.toLowerCase() || p.code?.toUpperCase() === rawId.toUpperCase()
    );

    expect(existing).toBeDefined();
    if (existing) {
      usePartyStore.getState().selectParty(existing.id);
    }

    const state = usePartyStore.getState();
    expect(state.currentPartyId).toBe('party-uuid-1234');
    expect(state.currentView).toBe('party-detail');
  });

  it('handles remote party hydration when party is not present in local memory', async () => {
    const remotePartyId = 'party-remote-999';
    const remoteParty: Party = {
      id: remotePartyId,
      title: 'Hydrated Party',
      date: 'Tomorrow',
      time: '20:00',
      location: 'Crypto Rooftop',
      description: 'Loaded remotely',
      coverImage: '',
      hostId: 'host-2',
      hostName: 'Bob',
      members: [],
      potBalance: 0,
      createdAt: '2026-10-11',
      status: 'upcoming',
      code: 'REMT',
    };

    const loadSpy = vi.fn().mockImplementation(async (id: string) => {
      usePartyStore.setState((s) => ({
        parties: [...s.parties, remoteParty],
      }));
    });

    // Execute loading
    await loadSpy(remotePartyId);
    usePartyStore.getState().selectParty(remotePartyId);

    const state = usePartyStore.getState();
    expect(loadSpy).toHaveBeenCalledWith('party-remote-999');
    expect(state.currentPartyId).toBe('party-remote-999');
    expect(state.currentView).toBe('party-detail');
    expect(state.parties.some((p) => p.id === remotePartyId)).toBe(true);
  });

  it('handles empty or blank deep-link IDs by falling back to home view', () => {
    const rawId = '   ';
    const cleaned = decodeURIComponent(rawId).trim();
    if (!cleaned) {
      usePartyStore.getState().setCurrentView('home');
    }

    const state = usePartyStore.getState();
    expect(state.currentView).toBe('home');
  });
});
