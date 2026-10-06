import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifyPrivyToken: vi.fn(),
  getServerSupabase: vi.fn(),
  getClientPrivyToken: vi.fn(),
  getSupabase: vi.fn(),
}));

vi.mock('@/lib/auth/serverPrivy', () => ({ verifyPrivyToken: mocks.verifyPrivyToken }));
vi.mock('@/lib/supabase/server', () => ({ getServerSupabase: mocks.getServerSupabase }));
vi.mock('@/hooks/usePrivySync', () => ({ getClientPrivyToken: mocks.getClientPrivyToken }));
vi.mock('@/lib/supabase/client', () => ({ getSupabase: mocks.getSupabase }));

import { GET } from '@/app/api/parties/read/route';
import { fetchPartiesFromDb } from '@/services/supabaseService';

type QueryResult = { data: Record<string, unknown>[] | null; error: unknown | null };
type QueryRecord = { table: string; columns: string; filters: [string, string, unknown][] };

const hostedParty = {
  id: 'host-party',
  host_id: 'actor-1',
  title: 'Hosted night',
  code: 'HOST1',
  date: '2026-10-08',
  time: '20:00',
  location: 'Bogota',
  description: null,
  cover_image: null,
  host_name: 'Host',
  pot_balance: '10',
  created_at: '2026-10-01T00:00:00.000Z',
  status: 'upcoming',
};
const joinedParty = {
  ...hostedParty,
  id: 'joined-party',
  host_id: 'another-host',
  title: 'Joined night',
  code: 'JOIN1',
};
const unrelatedParty = { ...hostedParty, id: 'unrelated-party', host_id: 'unrelated-user' };

describe('GET /api/parties/read', () => {
  let queries: QueryRecord[];
  let resultFor: (query: QueryRecord) => QueryResult;

  const request = (url = 'http://localhost/api/parties/read', authorization = 'Bearer valid-token') =>
    new NextRequest(url, { headers: authorization ? { authorization } : {} });

  beforeEach(() => {
    queries = [];
    resultFor = () => ({ data: [], error: null });
    mocks.verifyPrivyToken.mockResolvedValue({ userId: 'actor-1' });
    mocks.getServerSupabase.mockReturnValue({
      from: (table: string) => {
        const query: QueryRecord = { table, columns: '', filters: [] };
        queries.push(query);
        const builder = {
          select(columns: string) {
            query.columns = columns;
            return builder;
          },
          eq(column: string, value: unknown) {
            query.filters.push(['eq', column, value]);
            return builder;
          },
          in(column: string, value: unknown) {
            query.filters.push(['in', column, value]);
            return builder;
          },
          order(column: string, options: unknown) {
            query.filters.push(['order', column, options]);
            return builder;
          },
          then(resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) {
            return Promise.resolve(resultFor(query)).then(resolve, reject);
          },
        };
        return builder;
      },
    });
  });

  afterEach(() => vi.clearAllMocks());

  it.each([undefined, 'Bearer invalid-token'])('rejects a missing or invalid bearer without reading the database (%s)', async (authorization) => {
    if (authorization === 'Bearer invalid-token') {
      mocks.verifyPrivyToken.mockRejectedValue(new Error('invalid token'));
    }
    const response = await GET(request('http://localhost/api/parties/read', authorization || ''));

    expect(response.status).toBe(401);
    expect(mocks.getServerSupabase).not.toHaveBeenCalled();
    expect(queries).toHaveLength(0);
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('returns only verified actor host/member parties and reads scoped, minimal records', async () => {
    resultFor = (query) => {
      if (query.table === 'party_members' && query.filters.some(([kind, col]) => kind === 'eq' && col === 'user_id')) {
        return { data: [{ party_id: 'joined-party' }], error: null };
      }
      if (query.table === 'parties' && query.filters.some(([kind, col]) => kind === 'eq' && col === 'host_id')) {
        return { data: [hostedParty], error: null };
      }
      if (query.table === 'parties') {
        const ids = query.filters.find(([kind, col]) => kind === 'in' && col === 'id')?.[2] as string[];
        return { data: [hostedParty, joinedParty, unrelatedParty].filter((party) => ids.includes(party.id)), error: null };
      }
      if (query.table === 'party_members') {
        const ids = query.filters.find(([kind, col]) => kind === 'in' && col === 'party_id')?.[2] as string[];
        return {
          data: [
            { party_id: 'host-party', user_id: 'actor-1', name: 'Host member', role: 'host', status: 'going' },
            { party_id: 'joined-party', user_id: 'actor-1', name: 'Joined member', role: 'guest', status: 'going' },
            { party_id: 'joined-party', user_id: 'friend-1', name: 'Friend', role: 'guest', status: 'maybe' },
            { party_id: 'unrelated-party', user_id: 'secret-user', name: 'Secret', role: 'guest', status: 'going' },
          ].filter((member) => ids.includes(String(member.party_id))),
          error: null,
        };
      }
      if (query.table === 'users') {
        const ids = query.filters.find(([kind, col]) => kind === 'in' && col === 'id')?.[2] as string[];
        return { data: [{ id: 'actor-1', handle: '@actor', avatar: 'actor.png' }, { id: 'friend-1', handle: '@friend', avatar: 'friend.png' }].filter((user) => ids.includes(String(user.id))), error: null };
      }
      return { data: [], error: null };
    };

    const response = await GET(request());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(payload.parties.map((party: { id: string }) => party.id).sort()).toEqual(['host-party', 'joined-party']);
    expect(payload.parties.flatMap((party: { members: { user_id: string }[] }) => party.members.map((member) => member.user_id)).sort()).toEqual(['actor-1', 'actor-1', 'friend-1']);
    expect(queries.find((query) => query.table === 'parties' && query.filters.some(([kind, col]) => kind === 'eq' && col === 'host_id'))?.filters).toContainEqual(['eq', 'host_id', 'actor-1']);
    expect(queries.every((query) => query.table !== 'parties' || query.filters.some(([kind, col]) => (kind === 'eq' && col === 'host_id') || (kind === 'in' && col === 'id')))).toBe(true);
    const scopedMemberIds = queries.find((query) => query.table === 'party_members' && query.filters.some(([kind, col]) => kind === 'in' && col === 'party_id'))?.filters.find(([kind, col]) => kind === 'in' && col === 'party_id')?.[2] as string[];
    expect(scopedMemberIds.sort()).toEqual(['host-party', 'joined-party']);
    expect(queries.find((query) => query.table === 'users')?.columns).toBe('id, handle, avatar');
    expect(queries.find((query) => query.table === 'users')?.filters).toContainEqual(['in', 'id', ['actor-1', 'friend-1']]);
    expect(JSON.stringify(payload)).not.toContain('unrelated-party');
    expect(JSON.stringify(payload)).not.toContain('secret-user');
  });

  it('returns an empty list without unscoped reads when the actor has no hosted or joined parties', async () => {
    const response = await GET(request());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ parties: [] });
    expect(queries).toHaveLength(2);
    expect(queries.every((query) => query.filters.some(([kind, col]) => kind === 'eq' && col === 'user_id' || kind === 'eq' && col === 'host_id'))).toBe(true);
  });

  it('fails closed on membership read errors and throws without returning private rows', async () => {
    resultFor = (query) => query.table === 'party_members'
      ? { data: null, error: { message: 'private database detail' } }
      : { data: [hostedParty], error: null };
    const response = await GET(request());

    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Party data is temporarily unavailable.' });
    expect(JSON.stringify(payload)).not.toContain('private database detail');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('fails closed when the membership query throws', async () => {
    resultFor = () => { throw new Error('private database detail'); };
    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Party data is temporarily unavailable.' });
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('rejects caller-supplied scope selectors', async () => {
    const response = await GET(request('http://localhost/api/parties/read?partyId=unrelated-party'));

    expect(response.status).toBe(400);
    expect(mocks.getServerSupabase).not.toHaveBeenCalled();
  });
});

describe('fetchPartiesFromDb', () => {
  beforeEach(() => {
    mocks.getClientPrivyToken.mockResolvedValue('client-token');
    mocks.getSupabase.mockReturnValue({ from: vi.fn() });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ parties: [] }), { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('sends the Privy bearer to the scoped endpoint and never queries Supabase anonymously', async () => {
    await fetchPartiesFromDb('caller-controlled-user');

    expect(fetch).toHaveBeenCalledWith('/api/parties/read', expect.objectContaining({
      method: 'GET',
      headers: { Authorization: 'Bearer client-token' },
      cache: 'no-store',
    }));
    expect(mocks.getSupabase).not.toHaveBeenCalled();
  });

  it('maps scoped response records to the existing Party shape', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ parties: [{
      id: 'party-1',
      code: 'SAFE1',
      title: 'Private night',
      date: '2026-10-08',
      time: '20:00',
      location: 'Bogota',
      description: null,
      cover_image: null,
      host_id: 'actor-1',
      host_name: 'Host',
      pot_balance: '12',
      created_at: '2026-10-01T00:00:00.000Z',
      status: 'upcoming',
      crew_id: null,
      members: [{ user_id: 'actor-1', name: 'Host', role: 'host', status: 'going', avatar: 'host.png', handle: '@host' }],
    }] }), { status: 200 }));

    await expect(fetchPartiesFromDb('spoofed-user')).resolves.toEqual([expect.objectContaining({
      id: 'party-1',
      code: 'SAFE1',
      hostId: 'actor-1',
      coverImage: expect.any(String),
      potBalance: 12,
      members: [expect.objectContaining({ id: 'actor-1', handle: '@host', avatar: 'host.png' })],
    })]);
  });

  it('returns no database parties when the current Privy token is unavailable', async () => {
    mocks.getClientPrivyToken.mockResolvedValue(null);

    await expect(fetchPartiesFromDb('actor-1')).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.getSupabase).not.toHaveBeenCalled();
  });
});
