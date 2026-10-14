import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePartyStore } from '@/store/usePartyStore';
import { Party, Crew, User } from '@/types';

describe('Crew Management & Party Peer Aggregation', () => {
  const mockUser: User = {
    id: 'user-me',
    name: 'Carlos Dev',
    handle: '@carlosdev',
    avatar: 'https://images.unsplash.com/photo-carlos',
    gatheringsCount: 3,
    gamesCount: 2,
    peopleCount: 10,
    settlementsCount: 1,
    balance: 50,
    walletAddress: '0x1111111111111111111111111111111111111111',
  };

  const samplePastParty: Party = {
    id: 'party-past-1',
    title: 'Medellin Rooftop Party',
    date: 'Last Friday',
    time: '23:00',
    location: 'El Poblado',
    description: 'Great night',
    coverImage: 'https://images.unsplash.com/photo-roof',
    code: 'ROOF',
    hostId: 'user-me',
    hostName: 'Carlos Dev',
    status: 'past',
    members: [
      { id: 'user-me', name: 'Carlos Dev', avatar: '', role: 'host', status: 'going', nightsTogether: 1 },
      { id: 'peer-mateo', name: 'Mateo', avatar: '', role: 'guest', status: 'going', nightsTogether: 3 },
      { id: 'peer-valen', name: 'Valentina', avatar: '', role: 'guest', status: 'going', nightsTogether: 2 },
    ],
    potBalance: 50,
    createdAt: '2026-10-01',
  };

  const sampleCrew: Crew = {
    id: 'crew-alpha',
    name: 'Techno Syndicate',
    description: 'Weekend ravers',
    coverImage: 'https://images.unsplash.com/photo-techno',
    membersCount: 3,
    partiesCount: 4,
    totalSpent: 120,
    nightsTogether: 8,
    topGame: 'Never Have I Ever',
    treasuryBalance: 20,
    memories: [],
    lastActivity: 'Yesterday',
    ownerId: 'user-me',
    members: [
      { id: 'cm-1', userId: 'user-me', name: 'Carlos Dev', handle: '@carlosdev', avatar: '', joinedAt: '2026-10-01', role: 'owner', nightsTogether: 5 },
      { id: 'cm-2', userId: 'peer-mateo', name: 'Mateo', handle: '@mateo', avatar: '', joinedAt: '2026-10-02', role: 'admin', nightsTogether: 3 },
      { id: 'cm-3', userId: 'peer-dani', name: 'Daniela', handle: '@dani', avatar: '', joinedAt: '2026-10-03', role: 'member', nightsTogether: 1 },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    usePartyStore.setState({
      currentUser: mockUser,
      parties: [samplePastParty],
      crews: [sampleCrew],
      activities: [],
      currentCrewId: 'crew-alpha',
    });
  });

  it('aggregates unique past party peers across parties and mutual crews', () => {
    const peers = usePartyStore.getState().getPastPartyPeers();
    expect(peers.length).toBeGreaterThanOrEqual(3);

    // Current user should never be returned as a peer to themselves
    expect(peers.some((p) => p.id === 'user-me')).toBe(false);

    // Mateo, Valentina (from party), and Daniela (from crew) should be present
    const names = peers.map((p) => p.name);
    expect(names).toContain('Mateo');
    expect(names).toContain('Valentina');
    expect(names).toContain('Daniela');
  });

  it('creates a crew with initial members selected from past peers', () => {
    const newCrew = usePartyStore.getState().createCrew({
      name: 'After Hours Crew',
      description: 'Late night crew',
      coverImage: 'https://images.unsplash.com/photo-after',
      initialMembers: [
        { id: 'peer-valen', name: 'Valentina', nightsTogether: 2 },
      ],
    });

    expect(newCrew.name).toBe('After Hours Crew');
    expect(newCrew.ownerId).toBe('user-me');
    expect(newCrew.members.length).toBe(2); // Owner + Valentina

    const valen = newCrew.members.find((m) => m.name === 'Valentina');
    expect(valen).toBeDefined();
    expect(valen?.role).toBe('member');
  });

  it('allows owner or admin to remove a member, but forbids removing the owner', () => {
    // Attempt removing owner should fail closed
    const ownerRemoval = usePartyStore.getState().removeCrewMember('crew-alpha', 'user-me');
    expect(ownerRemoval).toBe(false);

    // Admin/Owner removing regular member Daniela should succeed
    const daniRemoval = usePartyStore.getState().removeCrewMember('crew-alpha', 'peer-dani');
    expect(daniRemoval).toBe(true);

    const crew = usePartyStore.getState().crews.find((c) => c.id === 'crew-alpha');
    expect(crew?.members.some((m) => m.userId === 'peer-dani')).toBe(false);
  });

  it('adds all crew members to an active party without duplicates', () => {
    const testParty: Party = {
      id: 'party-active-1',
      title: 'Saturday Warehouse',
      date: 'Tonight',
      time: '23:00',
      location: 'Warehouse 9',
      description: 'Monad hackathon beats',
      coverImage: 'https://images.unsplash.com/photo-wh',
      code: 'WH09',
      hostId: 'user-me',
      hostName: 'Carlos Dev',
      status: 'upcoming',
      members: [
        { id: 'user-me', name: 'Carlos Dev', avatar: '', role: 'host', status: 'going', nightsTogether: 5 },
      ],
      potBalance: 0,
      createdAt: '2026-10-13',
    };

    usePartyStore.setState((s) => ({ parties: [...s.parties, testParty] }));

    // Add crew-alpha members to testParty
    const addedCount = usePartyStore.getState().addCrewMembersToParty('party-active-1', 'crew-alpha');
    // crew-alpha has Mateo and Daniela (host Carlos Dev is already in party and should be skipped)
    expect(addedCount).toBe(2);

    const updatedParty = usePartyStore.getState().parties.find((p) => p.id === 'party-active-1');
    expect(updatedParty?.members.length).toBe(3); // Carlos, Mateo, Daniela
    expect(updatedParty?.crewId).toBe('crew-alpha');

    // Calling again should add 0 duplicates
    const secondAdd = usePartyStore.getState().addCrewMembersToParty('party-active-1', 'crew-alpha');
    expect(secondAdd).toBe(0);
  });

  it('creates party with addAllCrewMembers automatically populating members from the crew', () => {
    const party = usePartyStore.getState().createParty({
      title: 'Crew Reunion Night',
      date: 'Tomorrow',
      time: '22:00',
      location: 'Penthouse',
      description: 'Exclusive to our crew',
      coverImage: 'https://images.unsplash.com/photo-crew-p',
      crewId: 'crew-alpha',
      addAllCrewMembers: true,
    });

    expect(party.crewId).toBe('crew-alpha');
    // Members should include Carlos (host) + Mateo (invited) + Daniela (invited)
    expect(party.members.length).toBe(3);

    const mateo = party.members.find((m) => m.name === 'Mateo');
    expect(mateo?.status).toBe('invited');
    expect(mateo?.role).toBe('guest');
  });
});
