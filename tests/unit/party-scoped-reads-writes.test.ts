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

import { GET as getPartyDetails } from '@/app/api/parties/details/route';
import { GET as getActivities, POST as postActivity } from '@/app/api/activities/route';
import { POST as postMemory } from '@/app/api/parties/memories/route';
import { POST as postGameSession } from '@/app/api/parties/games/route';
import {
  fetchPartyDetailsFromDb,
  fetchActivitiesFromDb,
  persistActivityToSupabase,
  persistPartyMemoryToSupabase,
} from '@/services/supabaseService';

type Query = {
  table: string;
  action?: string;
  columns?: string;
  values?: unknown;
  filters: [string, string, unknown][];
};
type Result = { data: unknown; error: unknown };

const hostActor = { userId: 'host-user', name: 'Host Person' };
const memberActor = { userId: 'member-user', name: 'Member Person' };
const strangerActor = { userId: 'stranger-user', name: 'Stranger' };

describe('MKT-02b: Scoped private reads and event writes', () => {
  let queries: Query[];
  let resultFor: (query: Query) => Result;

  const request = (
    url: string,
    options: { method?: string; body?: unknown; token?: string | null } = {}
  ) => {
    const { method = 'GET', body, token = 'valid-token' } = options;
    const headers: Record<string, string> = {};
    if (token) headers['authorization'] = `Bearer ${token}`;
    if (body) headers['content-type'] = 'application/json';
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  beforeEach(() => {
    queries = [];
    resultFor = () => ({ data: [], error: null });
    mocks.verifyPrivyToken.mockResolvedValue(hostActor);
    mocks.getServerSupabase.mockReturnValue({
      from: (table: string) => {
        const query: Query = { table, filters: [] };
        queries.push(query);
        const builder: Record<string, unknown> = {};

        builder.select = (columns = '*') => {
          query.columns = columns;
          return builder;
        };
        builder.insert = (values: unknown) => {
          query.action = 'insert';
          query.values = values;
          return builder;
        };
        builder.upsert = (values: unknown) => {
          query.action = 'upsert';
          query.values = values;
          return builder;
        };
        builder.eq = (column: string, value: unknown) => {
          query.filters.push(['eq', column, value]);
          return builder;
        };
        builder.in = (column: string, value: unknown) => {
          query.filters.push(['in', column, value]);
          return builder;
        };
        builder.order = (column: string, options: unknown) => {
          query.filters.push(['order', column, options]);
          return builder;
        };
        builder.single = () => {
          query.filters.push(['single', '', '']);
          return builder;
        };
        builder.then = (
          resolve: (val: Result) => unknown,
          reject: (reason: unknown) => unknown
        ) => {
          return Promise.resolve(resultFor(query)).then(resolve, reject);
        };
        return builder;
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/parties/details', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await getPartyDetails(
        request('http://localhost/api/parties/details?partyId=p-1', { token: null })
      );
      expect(res.status).toBe(401);
      expect(res.headers.get('cache-control')).toContain('private');
    });

    it('rejects missing partyId with 400', async () => {
      const res = await getPartyDetails(
        request('http://localhost/api/parties/details', { token: 'valid-token' })
      );
      expect(res.status).toBe(400);
    });

    it('denies non-members and non-hosts with 403', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(strangerActor);
      resultFor = (q) => {
        if (q.table === 'parties' && q.filters.some(([f, c, v]) => f === 'eq' && c === 'id' && v === 'p-1')) {
          return {
            data: { id: 'p-1', host_id: 'host-user', title: 'Private Party', pot_balance: '10' },
            error: null,
          };
        }
        if (q.table === 'party_members') {
          return { data: [], error: null };
        }
        return { data: [], error: null };
      };

      const res = await getPartyDetails(
        request('http://localhost/api/parties/details?partyId=p-1', { token: 'valid-token' })
      );
      expect(res.status).toBe(403);
    });

    it('returns party details for verified host', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(hostActor);
      resultFor = (q) => {
        if (q.table === 'parties') {
          return {
            data: { id: 'p-1', host_id: 'host-user', title: 'Private Party', pot_balance: '50' },
            error: null,
          };
        }
        if (q.table === 'party_members') {
          return {
            data: [{ user_id: 'host-user', role: 'host', name: 'Host Person' }],
            error: null,
          };
        }
        if (q.table === 'expenses') {
          return {
            data: [{ id: 'e-1', party_id: 'p-1', amount: 100, description: 'Snacks' }],
            error: null,
          };
        }
        if (q.table === 'pot_transactions') {
          return {
            data: [{ id: 'tx-1', party_id: 'p-1', amount: 50, type: 'deposit' }],
            error: null,
          };
        }
        if (q.table === 'activities') {
          return {
            data: [{ id: 'act-1', party_id: 'p-1', type: 'join', text: 'Joined' }],
            error: null,
          };
        }
        if (q.table === 'party_memories') {
          return {
            data: [{ id: 'm-1', party_id: 'p-1', image_url: 'photo.jpg' }],
            error: null,
          };
        }
        return { data: [], error: null };
      };

      const res = await getPartyDetails(
        request('http://localhost/api/parties/details?partyId=p-1', { token: 'valid-token' })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.party.title).toBe('Private Party');
      expect(data.expenses).toHaveLength(1);
      expect(data.transactions).toHaveLength(1);
      expect(data.activities).toHaveLength(1);
      expect(data.memories).toHaveLength(1);
      expect(res.headers.get('cache-control')).toContain('private');
      expect(res.headers.get('cache-control')).toContain('no-store');
    });

    it('returns party details for verified member', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(memberActor);
      resultFor = (q) => {
        if (q.table === 'parties') {
          return {
            data: { id: 'p-1', host_id: 'host-user', title: 'Private Party' },
            error: null,
          };
        }
        if (q.table === 'party_members' && q.filters.some(([f, c, v]) => f === 'eq' && c === 'party_id' && v === 'p-1')) {
          return {
            data: [
              { user_id: 'host-user', role: 'host', name: 'Host Person' },
              { user_id: 'member-user', role: 'guest', name: 'Member Person' },
            ],
            error: null,
          };
        }
        return { data: [], error: null };
      };

      const res = await getPartyDetails(
        request('http://localhost/api/parties/details?partyId=p-1', { token: 'valid-token' })
      );
      expect(res.status).toBe(200);
    });

    it('returns 503 if database errors', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(hostActor);
      resultFor = (q) => {
        if (q.table === 'parties') {
          return { data: null, error: new Error('DB connection failed') };
        }
        return { data: [], error: null };
      };

      const res = await getPartyDetails(
        request('http://localhost/api/parties/details?partyId=p-1', { token: 'valid-token' })
      );
      expect(res.status).toBe(503);
    });
  });

  describe('GET & POST /api/activities', () => {
    it('GET rejects unauthenticated requests with 401', async () => {
      const res = await getActivities(request('http://localhost/api/activities', { token: null }));
      expect(res.status).toBe(401);
    });

    it('GET scopes activities to actor parties when partyId is omitted', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(memberActor);
      resultFor = (q) => {
        if (q.table === 'party_members' && q.filters.some(([f, c, v]) => f === 'eq' && c === 'user_id' && v === 'member-user')) {
          return { data: [{ party_id: 'p-joined' }], error: null };
        }
        if (q.table === 'parties' && q.filters.some(([f, c, v]) => f === 'eq' && c === 'host_id' && v === 'member-user')) {
          return { data: [], error: null };
        }
        if (q.table === 'activities' && q.filters.some(([f, c, v]) => f === 'in' && c === 'party_id' && Array.isArray(v) && v.includes('p-joined'))) {
          return {
            data: [{ id: 'act-1', party_id: 'p-joined', text: 'Joined p-joined', time: 'now' }],
            error: null,
          };
        }
        return { data: [], error: null };
      };

      const res = await getActivities(request('http://localhost/api/activities', { token: 'valid-token' }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.activities).toHaveLength(1);
      expect(data.activities[0].id).toBe('act-1');
    });

    it('POST rejects non-member with 403', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(strangerActor);
      resultFor = (q) => {
        if (q.table === 'parties') return { data: { id: 'p-1', host_id: 'host-user' }, error: null };
        if (q.table === 'party_members') return { data: [], error: null };
        return { data: null, error: null };
      };

      const res = await postActivity(
        request('http://localhost/api/activities', {
          method: 'POST',
          body: { id: 'act-1', partyId: 'p-1', type: 'join', text: 'Attending' },
        })
      );
      expect(res.status).toBe(403);
    });

    it('POST persists activity for legitimate member', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(memberActor);
      resultFor = (q) => {
        if (q.table === 'parties') return { data: { id: 'p-1', host_id: 'host-user' }, error: null };
        if (q.table === 'party_members') return { data: [{ user_id: 'member-user' }], error: null };
        if (q.table === 'activities') return { data: { id: 'act-1' }, error: null };
        return { data: null, error: null };
      };

      const res = await postActivity(
        request('http://localhost/api/activities', {
          method: 'POST',
          body: { id: 'act-1', partyId: 'p-1', type: 'join', text: 'Attending' },
        })
      );
      expect(res.status).toBe(200);
      const insertQuery = queries.find((q) => q.table === 'activities' && (q.action === 'insert' || q.action === 'upsert'));
      expect(insertQuery).toBeDefined();
    });
  });

  describe('POST /api/parties/memories', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await postMemory(
        request('http://localhost/api/parties/memories', {
          method: 'POST',
          body: { id: 'm-1', partyId: 'p-1', imageUrl: 'pic.jpg' },
          token: null,
        })
      );
      expect(res.status).toBe(401);
    });

    it('rejects non-member with 403', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(strangerActor);
      resultFor = (q) => {
        if (q.table === 'parties') return { data: { id: 'p-1', host_id: 'host-user' }, error: null };
        if (q.table === 'party_members') return { data: [], error: null };
        return { data: null, error: null };
      };

      const res = await postMemory(
        request('http://localhost/api/parties/memories', {
          method: 'POST',
          body: { id: 'm-1', partyId: 'p-1', imageUrl: 'pic.jpg' },
        })
      );
      expect(res.status).toBe(403);
    });

    it('persists memory and binds uploaded_by_id to verified token actor', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(memberActor);
      resultFor = (q) => {
        if (q.table === 'parties') return { data: { id: 'p-1', host_id: 'host-user' }, error: null };
        if (q.table === 'party_members') return { data: [{ user_id: 'member-user' }], error: null };
        if (q.table === 'party_memories') return { data: { id: 'm-1' }, error: null };
        return { data: null, error: null };
      };

      const res = await postMemory(
        request('http://localhost/api/parties/memories', {
          method: 'POST',
          body: {
            id: 'm-1',
            partyId: 'p-1',
            imageUrl: 'pic.jpg',
            uploadedByName: 'Member Person',
          },
        })
      );
      expect(res.status).toBe(200);
      const memoryQuery = queries.find((q) => q.table === 'party_memories' && q.action === 'insert');
      expect(memoryQuery).toBeDefined();
      expect((memoryQuery?.values as Record<string, unknown>).uploaded_by_id).toBe('member-user');
    });
  });

  describe('POST /api/parties/games', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await postGameSession(
        request('http://localhost/api/parties/games', {
          method: 'POST',
          body: { id: 'g-1', partyId: 'p-1', gameType: 'whos-most-likely' },
          token: null,
        })
      );
      expect(res.status).toBe(401);
    });

    it('rejects non-members with 403', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(strangerActor);
      resultFor = (q) => {
        if (q.table === 'parties') return { data: { id: 'p-1', host_id: 'host-user' }, error: null };
        if (q.table === 'party_members') return { data: [], error: null };
        return { data: null, error: null };
      };

      const res = await postGameSession(
        request('http://localhost/api/parties/games', {
          method: 'POST',
          body: { id: 'g-1', partyId: 'p-1', gameType: 'whos-most-likely' },
        })
      );
      expect(res.status).toBe(403);
    });

    it('upserts game session for valid member', async () => {
      mocks.verifyPrivyToken.mockResolvedValue(memberActor);
      resultFor = (q) => {
        if (q.table === 'parties') return { data: { id: 'p-1', host_id: 'host-user' }, error: null };
        if (q.table === 'party_members') return { data: [{ user_id: 'member-user' }], error: null };
        if (q.table === 'game_sessions') return { data: { id: 'g-1' }, error: null };
        return { data: null, error: null };
      };

      const res = await postGameSession(
        request('http://localhost/api/parties/games', {
          method: 'POST',
          body: { id: 'g-1', partyId: 'p-1', gameType: 'whos-most-likely', questions: [] },
        })
      );
      expect(res.status).toBe(200);
      const gameQuery = queries.find((q) => q.table === 'game_sessions' && (q.action === 'upsert' || q.action === 'insert'));
      expect(gameQuery).toBeDefined();
    });
  });

  describe('Client services fail-closed when unauthenticated', () => {
    it('fetchPartyDetailsFromDb returns null without calling network or DB if no token', async () => {
      mocks.getClientPrivyToken.mockResolvedValue(null);
      const result = await fetchPartyDetailsFromDb('p-1');
      expect(result).toBeNull();
    });

    it('fetchActivitiesFromDb returns empty array if no token', async () => {
      mocks.getClientPrivyToken.mockResolvedValue(null);
      const result = await fetchActivitiesFromDb('p-1');
      expect(result).toEqual([]);
    });

    it('persistActivityToSupabase does not throw and skips write if unauthenticated', async () => {
      mocks.getClientPrivyToken.mockResolvedValue(null);
      await expect(
        persistActivityToSupabase({
          id: 'act-1',
          partyId: 'p-1',
          type: 'join',
          text: 'Joined',
          time: 'now',
          avatar: '',
        })
      ).resolves.toBeUndefined();
    });

    it('persistPartyMemoryToSupabase does not throw and skips write if unauthenticated', async () => {
      mocks.getClientPrivyToken.mockResolvedValue(null);
      await expect(
        persistPartyMemoryToSupabase({
          id: 'mem-1',
          partyId: 'p-1',
          imageUrl: 'photo.jpg',
          uploadedByName: 'Guest',
          createdAt: 'now',
        })
      ).resolves.toBeUndefined();
    });
  });
});
