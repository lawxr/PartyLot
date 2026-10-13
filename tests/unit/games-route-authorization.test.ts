import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifyPrivyToken: vi.fn(),
  getServerSupabase: vi.fn(),
}));

vi.mock('@/lib/auth/serverPrivy', () => ({ verifyPrivyToken: mocks.verifyPrivyToken }));
vi.mock('@/lib/supabase/server', () => ({ getServerSupabase: mocks.getServerSupabase }));

import { POST as gamesRoute } from '@/app/api/parties/games/route';

type Query = {
  table: string;
  action?: string;
  values?: Record<string, unknown> | Record<string, unknown>[];
  filters: [string, string, unknown][];
};

type Result = { data: Record<string, unknown> | Record<string, unknown>[] | null; error: unknown | null };

const actor = { userId: 'privy-actor', name: 'Verified Actor' };

describe('/api/parties/games route authorization & security', () => {
  let queries: Query[];
  let resultFor: (query: Query) => Result;

  const request = (body: unknown, token = 'valid-token') =>
    new NextRequest('http://localhost/api/parties/games', {
      method: 'POST',
      headers: token
        ? { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
        : { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    queries = [];
    resultFor = () => ({ data: null, error: null });
    mocks.verifyPrivyToken.mockResolvedValue(actor);
    mocks.getServerSupabase.mockReturnValue({
      from: (table: string) => {
        const query: Query = { table, filters: [] };
        queries.push(query);
        const builder: Record<string, unknown> = {};
        const chain = (action: string) => (values?: unknown) => {
          query.action = action;
          if (values !== undefined) query.values = values as Query['values'];
          return builder;
        };
        builder.insert = chain('insert');
        builder.upsert = chain('upsert');
        builder.select = chain('select');
        builder.eq = (column: string, value: unknown) => {
          query.filters.push(['eq', column, value]);
          return builder;
        };
        builder.maybeSingle = async () => resultFor(query);
        builder.single = async () => resultFor(query);
        builder.then = (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve(resultFor(query)).then(resolve, reject);
        return builder;
      },
    });
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await gamesRoute(request({ partyId: 'p1', gameType: 'whos-most-likely' }, ''));
    expect(res.status).toBe(401);
    expect(queries).toHaveLength(0);
  });

  it('rejects invalid Privy token with 401', async () => {
    mocks.verifyPrivyToken.mockRejectedValueOnce(new Error('Invalid token'));
    const res = await gamesRoute(request({ partyId: 'p1', gameType: 'whos-most-likely' }, 'bad-token'));
    expect(res.status).toBe(401);
    expect(queries).toHaveLength(0);
  });

  it('rejects non-members with 403', async () => {
    resultFor = (q) => {
      if (q.table === 'parties') {
        return { data: { host_id: 'host-other' }, error: null };
      }
      if (q.table === 'party_members') {
        return { data: [], error: null }; // not a member
      }
      return { data: null, error: null };
    };

    const res = await gamesRoute(
      request({
        partyId: 'p1',
        gameType: 'whos-most-likely',
        questionId: 'wml-0',
        choice: 'm1',
      })
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Forbidden');
  });

  it('ignores forged actorId or questions array passed by client and uses verified Privy identity', async () => {
    const existingSession = {
      id: 'gs-p1-tot',
      party_id: 'p1',
      game_type: 'this-or-that',
      questions: [
        {
          id: 'tot-1',
          optionA: 'BEACH SUNRISE',
          optionB: 'ROOFTOP 4AM',
          voters: { 'other-user': 'B' },
          votesA: 0,
          votesB: 1,
        },
      ],
    };

    resultFor = (q) => {
      if (q.table === 'parties') return { data: { host_id: 'privy-actor' }, error: null };
      if (q.table === 'party_members') return { data: [{ user_id: 'privy-actor' }], error: null };
      if (q.table === 'game_sessions' && q.action === 'select') {
        return { data: existingSession, error: null };
      }
      return { data: null, error: null };
    };

    const res = await gamesRoute(
      request({
        partyId: 'p1',
        gameType: 'this-or-that',
        questionId: 'tot-1',
        choice: 'A',
        // Attempt to forge actorId or overwrite other user's vote
        actorId: 'other-user',
        votesA: 999,
        questions: [{ id: 'tot-1', votesA: 999, votesB: 0 }],
      })
    );

    expect(res.status).toBe(200);
    const upsertQuery = queries.find((q) => q.table === 'game_sessions' && q.action === 'upsert');
    expect(upsertQuery).toBeDefined();

    const savedQuestions = (upsertQuery?.values as Record<string, unknown>).questions as Array<Record<string, unknown>>;
    const q1 = savedQuestions[0];

    // The other user's vote must remain untouched!
    expect(q1.voters).toEqual({
      'other-user': 'B',
      'privy-actor': 'A',
    });
    // Votes must be properly derived, ignoring client forged votesA: 999
    expect(q1.votesA).toBe(1);
    expect(q1.votesB).toBe(1);
  });

  it('rejects invalid choice for this-or-that', async () => {
    resultFor = (q) => {
      if (q.table === 'parties') return { data: { host_id: 'privy-actor' }, error: null };
      if (q.table === 'party_members') return { data: [{ user_id: 'privy-actor' }], error: null };
      return { data: null, error: null };
    };

    const res = await gamesRoute(
      request({
        partyId: 'p1',
        gameType: 'this-or-that',
        questionId: 'tot-1',
        choice: 'C', // Invalid!
      })
    );

    expect(res.status).toBe(400);
  });
});
