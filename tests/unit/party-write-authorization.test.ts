import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifyPrivyToken: vi.fn(),
  getServerSupabase: vi.fn(),
  checkRateLimit: vi.fn(),
  registerPartyOnchain: vi.fn(),
}));

vi.mock('@/lib/auth/serverPrivy', () => ({ verifyPrivyToken: mocks.verifyPrivyToken }));
vi.mock('@/lib/supabase/server', () => ({ getServerSupabase: mocks.getServerSupabase }));
vi.mock('@/lib/security/rateLimit', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('@/services/treasury', () => ({ registerPartyOnchain: mocks.registerPartyOnchain }));

import { POST as createParty } from '@/app/api/parties/route';
import { POST as createExpense } from '@/app/api/expenses/route';

type Query = {
  table: string;
  action?: string;
  values?: Record<string, unknown> | Record<string, unknown>[];
  filters: [string, string, unknown][];
};
type Result = { data: Record<string, unknown> | Record<string, unknown>[] | null; error: unknown | null };

const actor = { userId: 'privy-actor', name: 'Verified Actor', handle: '@verified', avatar: 'verified.png', walletAddress: null };
const members = [
  { user_id: 'privy-actor', name: 'Verified Actor', avatar: 'verified.png' },
  { user_id: 'member-2', name: 'Member Two', avatar: 'member.png' },
];

describe('party and expense write authorization', () => {
  let queries: Query[];
  let resultFor: (query: Query) => Result;

  const request = (url: string, body: unknown, token = 'valid-token') => new NextRequest(url, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}`, 'content-type': 'application/json' } : { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  beforeEach(() => {
    queries = [];
    resultFor = () => ({ data: null, error: null });
    mocks.verifyPrivyToken.mockResolvedValue(actor);
    mocks.checkRateLimit.mockReturnValue({ allowed: true });
    mocks.registerPartyOnchain.mockResolvedValue(undefined);
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
        builder.eq = (column: string, value: unknown) => { query.filters.push(['eq', column, value]); return builder; };
        builder.maybeSingle = async () => resultFor(query);
        builder.single = async () => resultFor(query);
        builder.then = (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(resultFor(query)).then(resolve, reject);
        return builder;
      },
    });
  });

  it.each([
    ['party creation', createParty, 'http://localhost/api/parties'],
    ['expense creation', createExpense, 'http://localhost/api/expenses'],
  ] as const)('rejects missing authentication for %s before database access', async (_label, handler, url) => {
    const response = await handler(request(url, { id: 'forged', title: 'Party' }, ''));

    expect(response.status).toBe(401);
    expect(queries).toHaveLength(0);
  });

  it.each([
    ['party creation', createParty, 'http://localhost/api/parties'],
    ['expense creation', createExpense, 'http://localhost/api/expenses'],
  ] as const)('rejects invalid authentication for %s before database access', async (_label, handler, url) => {
    mocks.verifyPrivyToken.mockRejectedValueOnce(new Error('invalid token'));
    const response = await handler(request(url, { id: 'forged', title: 'Party' }, 'invalid-token'));

    expect(response.status).toBe(401);
    expect(queries).toHaveLength(0);
  });

  it('creates a new party using verified identity and create-only persistence', async () => {
    const response = await createParty(request('http://localhost/api/parties', {
      id: 'new-party', title: 'New party', hostUser: { id: 'forged-host', name: 'Forged' },
    }));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.party.hostId).toBe('privy-actor');
    expect(queries.find((query) => query.table === 'parties' && query.action === 'insert')).toMatchObject({
      action: 'insert',
      values: expect.objectContaining({ id: 'new-party', host_id: 'privy-actor', host_name: 'Verified Actor' }),
    });
    expect(queries.find((query) => query.table === 'parties')?.action).not.toBe('upsert');
    expect(mocks.registerPartyOnchain).toHaveBeenCalledWith('new-party', undefined);
  });

  it('rejects a pre-existing party ID without follow-up side effects', async () => {
    resultFor = (query) => query.table === 'parties' && query.action === 'select'
      ? { data: { id: 'owned-party' }, error: null }
      : { data: null, error: null };

    const response = await createParty(request('http://localhost/api/parties', { id: 'owned-party', title: 'Takeover' }));

    expect(response.status).toBe(409);
    expect(queries.filter((query) => ['party_members', 'invitations', 'activities'].includes(query.table))).toHaveLength(0);
    expect(mocks.registerPartyOnchain).not.toHaveBeenCalled();
  });

  it('rejects a party ID lost in the insert race without follow-up side effects', async () => {
    resultFor = (query) => query.table === 'parties' && query.action === 'insert'
      ? { data: null, error: { code: '23505', message: 'duplicate key' } }
      : { data: null, error: null };

    const response = await createParty(request('http://localhost/api/parties', { id: 'raced-party', title: 'Party' }));

    expect(response.status).toBe(409);
    expect(queries.find((query) => query.table === 'parties' && query.action === 'insert')).toBeDefined();
    expect(queries.filter((query) => ['party_members', 'invitations', 'activities'].includes(query.table))).toHaveLength(0);
    expect(mocks.registerPartyOnchain).not.toHaveBeenCalled();
  });

  it('rejects an unrelated crew and does not create a party', async () => {
    resultFor = (query) => query.table === 'crews'
      ? { data: { id: 'other-crew', owner_id: 'other-user' }, error: null }
      : { data: null, error: null };

    const response = await createParty(request('http://localhost/api/parties', { id: 'new-party', title: 'New party', crewId: 'other-crew' }));

    expect(response.status).toBe(403);
    expect(queries.some((query) => query.table === 'parties')).toBe(false);
    expect(mocks.registerPartyOnchain).not.toHaveBeenCalled();
  });

  it.each([
    ['owner', { id: 'crew-1', owner_id: 'privy-actor' }, false],
    ['member', { id: 'crew-1', owner_id: 'crew-owner' }, true],
  ] as const)('allows a verified crew %s to create an associated party using scoped filters', async (_role, crew, hasMemberLookup) => {
    resultFor = (query) => query.table === 'crews'
      ? { data: crew, error: null }
      : query.table === 'crew_members'
        ? { data: { user_id: 'privy-actor' }, error: null }
        : { data: null, error: null };

    const response = await createParty(request('http://localhost/api/parties', {
      id: 'crew-party', title: 'Crew party', crewId: 'crew-1',
    }));

    expect(response.status).toBe(201);
    expect(queries.find((query) => query.table === 'crews')?.filters).toContainEqual(['eq', 'id', 'crew-1']);
    if (hasMemberLookup) {
      expect(queries.find((query) => query.table === 'crew_members')?.filters).toEqual([
        ['eq', 'crew_id', 'crew-1'],
        ['eq', 'user_id', 'privy-actor'],
      ]);
    } else {
      expect(queries.some((query) => query.table === 'crew_members')).toBe(false);
    }
    expect(queries.find((query) => query.table === 'parties' && query.action === 'insert')?.values)
      .toMatchObject({ crew_id: 'crew-1' });
  });

  it('fails closed when crew or crew-membership lookup is unavailable', async () => {
    resultFor = (query) => query.table === 'crews'
      ? { data: null, error: { message: 'crew lookup unavailable' } }
      : { data: null, error: null };

    const crewResponse = await createParty(request('http://localhost/api/parties', {
      id: 'party-1', title: 'Party', crewId: 'crew-1',
    }));
    expect(crewResponse.status).toBe(503);
    expect(queries.some((query) => query.table === 'parties' && query.action === 'insert')).toBe(false);

    queries = [];
    resultFor = (query) => query.table === 'crews'
      ? { data: { id: 'crew-1', owner_id: 'crew-owner' }, error: null }
      : query.table === 'crew_members'
        ? { data: null, error: { message: 'membership lookup unavailable' } }
        : { data: null, error: null };
    const membershipResponse = await createParty(request('http://localhost/api/parties', {
      id: 'party-2', title: 'Party', crewId: 'crew-1',
    }));
    expect(membershipResponse.status).toBe(503);
    expect(queries.some((query) => query.table === 'parties' && query.action === 'insert')).toBe(false);
  });

  it('rejects a non-member expense before any write', async () => {
    resultFor = (query) => query.table === 'parties'
      ? { data: { id: 'party-1', host_id: 'host-1' }, error: null }
      : query.table === 'party_members'
        ? { data: [], error: null }
        : { data: null, error: null };

    const response = await createExpense(request('http://localhost/api/expenses', {
      id: 'expense-1', partyId: 'party-1', description: 'Dinner', amount: 20, paidById: 'member-2', splitBetweenIds: ['member-2'],
    }));

    expect(response.status).toBe(403);
    expect(queries.find((query) => query.table === 'parties')?.filters).toContainEqual(['eq', 'id', 'party-1']);
    expect(queries.find((query) => query.table === 'party_members')?.filters).toContainEqual(['eq', 'party_id', 'party-1']);
    expect(queries.some((query) => ['expenses', 'activities'].includes(query.table))).toBe(false);
  });

  it('lets an authenticated party member log an expense paid by another party member', async () => {
    resultFor = (query) => query.table === 'parties'
      ? { data: { id: 'party-1', host_id: 'host-1' }, error: null }
      : query.table === 'party_members'
        ? { data: members, error: null }
        : { data: null, error: null };

    const response = await createExpense(request('http://localhost/api/expenses', {
      id: 'expense-1', partyId: 'party-1', description: 'Dinner', amount: 20, paidById: 'member-2', splitBetweenIds: ['privy-actor', 'member-2'],
    }));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.expense.paidById).toBe('member-2');
    expect(payload.expense.paidByName).toBe('Member Two');
    expect(queries.find((query) => query.table === 'expenses')).toMatchObject({
      action: 'insert',
      values: expect.objectContaining({ paid_by_id: 'member-2', split_between_ids: ['privy-actor', 'member-2'] }),
    });
    expect(queries.find((query) => query.table === 'party_members')?.filters).toContainEqual(['eq', 'party_id', 'party-1']);
  });

  it.each([
    ['forged payer', { paidById: 'outside-user', splitBetweenIds: ['privy-actor'] }],
    ['forged split participant', { paidById: 'member-2', splitBetweenIds: ['outside-user'] }],
    ['duplicate split participant', { paidById: 'member-2', splitBetweenIds: ['member-2', 'member-2'] }],
    ['malformed split list', { paidById: 'member-2', splitBetweenIds: ['member-2', 42] }],
  ])('rejects %s without expense or activity writes', async (_caseName, fields) => {
    resultFor = (query) => query.table === 'parties'
      ? { data: { id: 'party-1', host_id: 'host-1' }, error: null }
      : query.table === 'party_members'
        ? { data: members, error: null }
        : { data: null, error: null };

    const response = await createExpense(request('http://localhost/api/expenses', {
      id: 'expense-1', partyId: 'party-1', description: 'Dinner', amount: 20, ...fields,
    }));

    expect(response.status).toBe(400);
    expect(queries.some((query) => ['expenses', 'activities'].includes(query.table))).toBe(false);
  });

  it('rejects an expense-ID conflict instead of overwriting an existing expense', async () => {
    resultFor = (query) => query.table === 'parties'
      ? { data: { id: 'party-1', host_id: 'privy-actor' }, error: null }
      : query.table === 'party_members'
        ? { data: members, error: null }
        : query.table === 'expenses'
          ? { data: null, error: { code: '23505', message: 'duplicate key' } }
          : { data: null, error: null };

    const response = await createExpense(request('http://localhost/api/expenses', {
      id: 'existing-expense', partyId: 'party-1', description: 'Dinner', amount: 20, paidById: 'member-2', splitBetweenIds: ['member-2'],
    }));

    expect(response.status).toBe(409);
    expect(queries.find((query) => query.table === 'expenses')?.action).toBe('insert');
    expect(queries.some((query) => query.table === 'activities')).toBe(false);
  });

  it('fails closed when party membership lookup errors', async () => {
    resultFor = (query) => query.table === 'parties'
      ? { data: { id: 'party-1', host_id: 'host-1' }, error: null }
      : query.table === 'party_members'
        ? { data: null, error: { message: 'database unavailable' } }
        : { data: null, error: null };

    const response = await createExpense(request('http://localhost/api/expenses', {
      partyId: 'party-1', description: 'Dinner', amount: 20, paidById: 'member-2', splitBetweenIds: ['member-2'],
    }));

    expect(response.status).toBe(503);
    expect(queries.some((query) => ['expenses', 'activities'].includes(query.table))).toBe(false);
  });

  it('fails closed when party membership lookup throws', async () => {
    resultFor = (query) => query.table === 'parties'
      ? { data: { id: 'party-1', host_id: 'host-1' }, error: null }
      : { data: null, error: null };
    const originalGetServerSupabase = mocks.getServerSupabase.getMockImplementation();
    mocks.getServerSupabase.mockImplementation(() => ({
      from: (table: string) => {
        if (table === 'party_members') throw new Error('membership lookup threw');
        return originalGetServerSupabase?.().from(table);
      },
    }));

    const response = await createExpense(request('http://localhost/api/expenses', {
      partyId: 'party-1', description: 'Dinner', amount: 20, paidById: 'member-2', splitBetweenIds: ['member-2'],
    }));

    expect(response.status).toBe(500);
    expect(queries.some((query) => ['expenses', 'activities'].includes(query.table))).toBe(false);
  });

  it.each(['resolved error', 'thrown failure'] as const)(
    'returns saved expense success when ancillary activity insertion has a %s',
    async (failure) => {
      resultFor = (query) => {
        if (query.table === 'activities' && failure === 'thrown failure') {
          throw new Error('activity insertion threw');
        }
        return query.table === 'parties'
          ? { data: { id: 'party-1', host_id: 'host-1' }, error: null }
          : query.table === 'party_members'
            ? { data: members, error: null }
            : query.table === 'activities'
              ? { data: null, error: { message: 'activity unavailable' } }
              : { data: null, error: null };
      };

      const response = await createExpense(request('http://localhost/api/expenses', {
        partyId: 'party-1', description: 'Dinner', amount: 20, paidById: 'member-2', splitBetweenIds: ['member-2'],
      }));
      const payload = await response.json();

      expect(response.status).toBe(201);
      expect(payload.success).toBe(true);
      expect(payload.warning).toContain('activity');
      expect(queries.some((query) => query.table === 'expenses' && query.action === 'insert')).toBe(true);
    }
  );

  it.each(['resolved error', 'thrown failure'] as const)(
    'returns created party success when ancillary activity insertion has a %s',
    async (failure) => {
      resultFor = (query) => {
        if (query.table === 'activities' && failure === 'thrown failure') {
          throw new Error('activity insertion threw');
        }
        return query.table === 'activities'
          ? { data: null, error: { message: 'activity unavailable' } }
          : { data: null, error: null };
      };

      const response = await createParty(request('http://localhost/api/parties', { id: 'new-party', title: 'Party' }));
      const payload = await response.json();

      expect(response.status).toBe(201);
      expect(payload.success).toBe(true);
      expect(payload.warning).toContain('activity');
      expect(queries.some((query) => query.table === 'parties' && query.action === 'insert')).toBe(true);
      expect(mocks.registerPartyOnchain).toHaveBeenCalledWith('new-party', undefined);
    }
  );
});
