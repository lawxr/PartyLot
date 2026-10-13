import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifyPrivyToken: vi.fn(),
  getServerSupabase: vi.fn(),
  getPartyPotBalanceOnchain: vi.fn(),
}));

vi.mock('@/lib/auth/serverPrivy', () => ({ verifyPrivyToken: mocks.verifyPrivyToken }));
vi.mock('@/lib/supabase/server', () => ({ getServerSupabase: mocks.getServerSupabase }));
vi.mock('@/services/treasury', () => ({ getPartyPotBalanceOnchain: mocks.getPartyPotBalanceOnchain }));

import { DELETE, GET, PATCH, POST } from '@/app/api/parties/manage/route';
import { buildPartyPatch } from '@/lib/partyAdmin';

type Query = {
  table: string;
  action?: string;
  values?: unknown;
  filters: [string, string, unknown][];
};
type Result = { data: unknown; error: unknown | null };

const HOST = 'did:privy:host';
const GUEST = 'did:privy:guest';
const STRANGER = 'did:privy:stranger';

const isWrite = (q: Query) => q.action === 'update' || q.action === 'delete' || q.action === 'insert';
const has = (q: Query, col: string, val: unknown) => q.filters.some(([, c, v]) => c === col && v === val);

describe('/api/parties/manage — host administration', () => {
  let queries: Query[];
  let actor: string;
  let party: Record<string, unknown> | null;
  let resultFor: (q: Query) => Result;

  const req = (method: string, body?: unknown, url = 'http://localhost/api/parties/manage', token = 'tok') =>
    new NextRequest(url, {
      method,
      headers: token ? { authorization: `Bearer ${token}`, 'content-type': 'application/json' } : { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

  beforeEach(() => {
    queries = [];
    actor = HOST;
    party = { id: 'p1', host_id: HOST, host_name: 'Host', title: 'Friday', pot_balance: 0, crew_id: null, code: 'AB12' };
    mocks.verifyPrivyToken.mockImplementation(async () => ({ userId: actor, name: actor === HOST ? 'Host' : 'Guest' }));
    mocks.getPartyPotBalanceOnchain.mockResolvedValue(null);
    resultFor = (q) => {
      if (q.table === 'parties' && q.action === 'select') return { data: party, error: null };
      return { data: [], error: null };
    };
    mocks.getServerSupabase.mockReturnValue({
      from: (table: string) => {
        const q: Query = { table, filters: [] };
        queries.push(q);
        const b: Record<string, unknown> = {};
        const chain = (action: string) => (values?: unknown) => {
          q.action = q.action && action === 'select' ? q.action : action;
          if (values !== undefined && action !== 'select') q.values = values;
          return b;
        };
        b.select = chain('select');
        b.insert = chain('insert');
        b.update = chain('update');
        b.delete = chain('delete');
        b.eq = (c: string, v: unknown) => (q.filters.push(['eq', c, v]), b);
        b.in = (c: string, v: unknown) => (q.filters.push(['in', c, v]), b);
        b.maybeSingle = async () => resultFor(q);
        b.single = async () => resultFor(q);
        b.then = (res: (r: Result) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(resultFor(q)).then(res, rej);
        return b;
      },
    });
  });

  it('rejects every method without a token', async () => {
    for (const r of [
      PATCH(req('PATCH', { partyId: 'p1', updates: { title: 'x' } }, undefined, '')),
      POST(req('POST', { partyId: 'p1', action: 'remove', userId: GUEST }, undefined, '')),
      DELETE(req('DELETE', undefined, 'http://localhost/api/parties/manage?partyId=p1', '')),
      GET(req('GET', undefined, 'http://localhost/api/parties/manage?partyId=p1', '')),
    ]) {
      expect((await r).status).toBe(401);
    }
    expect(queries).toHaveLength(0);
  });

  describe('PATCH (edit details)', () => {
    it('lets the host edit allowed fields, scoped to their own party', async () => {
      const res = await PATCH(req('PATCH', { partyId: 'p1', updates: { title: '  New name ', location: 'Rooftop', coverImage: 'https://cdn/x.jpg' } }));
      expect(res.status).toBe(200);
      const upd = queries.find((q) => q.table === 'parties' && q.action === 'update')!;
      expect(upd.values).toEqual({ title: 'New name', location: 'Rooftop', cover_image: 'https://cdn/x.jpg' });
      expect(has(upd, 'id', 'p1') && has(upd, 'host_id', HOST)).toBe(true);
    });

    it('forbids non-hosts', async () => {
      actor = GUEST;
      const res = await PATCH(req('PATCH', { partyId: 'p1', updates: { title: 'Hijack' } }));
      expect(res.status).toBe(403);
      expect(queries.some(isWrite)).toBe(false);
    });

    it('rejects fields that are not editable (host, pot, code)', async () => {
      for (const updates of [{ host_id: GUEST }, { pot_balance: '99' }, { code: 'ZZZZ' }, { title: '' }, { coverImage: 'javascript:alert(1)' }]) {
        const res = await PATCH(req('PATCH', { partyId: 'p1', updates }));
        expect(res.status).toBe(400);
      }
      expect(queries.some(isWrite)).toBe(false);
    });

    it('returns 404 for a missing party', async () => {
      party = null;
      const res = await PATCH(req('PATCH', { partyId: 'nope', updates: { title: 'x' } }));
      expect(res.status).toBe(404);
    });
  });

  describe('POST (people)', () => {
    it('lets the host remove a guest', async () => {
      const res = await POST(req('POST', { partyId: 'p1', action: 'remove', userId: GUEST }));
      expect(res.status).toBe(200);
      const del = queries.find((q) => q.table === 'party_members' && q.action === 'delete')!;
      expect(has(del, 'party_id', 'p1') && has(del, 'user_id', GUEST)).toBe(true);
    });

    it('forbids a guest from removing anyone', async () => {
      actor = GUEST;
      const res = await POST(req('POST', { partyId: 'p1', action: 'remove', userId: STRANGER }));
      expect(res.status).toBe(403);
      expect(queries.some(isWrite)).toBe(false);
    });

    it('does not let the host remove themselves', async () => {
      const res = await POST(req('POST', { partyId: 'p1', action: 'remove', userId: HOST }));
      expect(res.status).toBe(409);
      expect(queries.some(isWrite)).toBe(false);
    });

    it('lets a guest leave (only their own row) and stops the host from leaving', async () => {
      actor = GUEST;
      let res = await POST(req('POST', { partyId: 'p1', action: 'leave', userId: STRANGER }));
      expect(res.status).toBe(200);
      const del = queries.find((q) => q.action === 'delete')!;
      expect(has(del, 'user_id', GUEST)).toBe(true);
      expect(has(del, 'user_id', STRANGER)).toBe(false);

      queries = [];
      actor = HOST;
      res = await POST(req('POST', { partyId: 'p1', action: 'leave' }));
      expect(res.status).toBe(409);
      expect(queries.some(isWrite)).toBe(false);
    });

    it('only adds people the host already knows', async () => {
      resultFor = (q) => {
        if (q.table === 'parties') return { data: party, error: null };
        if (q.table === 'users') return { data: { id: STRANGER, name: 'Stranger' }, error: null };
        return { data: [], error: null };
      };
      const res = await POST(req('POST', { partyId: 'p1', action: 'add', userId: STRANGER }));
      expect(res.status).toBe(403);
      expect(queries.some((q) => q.table === 'party_members' && q.action === 'insert')).toBe(false);
    });

    it('adds a crew-mate as an invited guest', async () => {
      resultFor = (q) => {
        if (q.table === 'parties') return { data: party, error: null };
        if (q.table === 'users') return { data: { id: GUEST, name: 'Guest', avatar: null, wallet_address: null }, error: null };
        if (q.table === 'crew_members' && has(q, 'user_id', HOST)) return { data: [{ crew_id: 'c1' }], error: null };
        if (q.table === 'crew_members' && has(q, 'user_id', GUEST)) return { data: [{ crew_id: 'c1' }], error: null };
        return { data: [], error: null };
      };
      const res = await POST(req('POST', { partyId: 'p1', action: 'add', userId: GUEST }));
      expect(res.status).toBe(200);
      const ins = queries.find((q) => q.table === 'party_members' && q.action === 'insert')!;
      expect(ins.values).toMatchObject({ party_id: 'p1', user_id: GUEST, role: 'guest', status: 'invited' });
    });

    it('rotates the invite code (revokes old, issues new)', async () => {
      const res = await POST(req('POST', { partyId: 'p1', action: 'rotate-code' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(queries.some((q) => q.table === 'invitations' && q.action === 'update')).toBe(true);
      expect(queries.some((q) => q.table === 'invitations' && q.action === 'insert')).toBe(true);
    });

    it('rejects unknown actions', async () => {
      const res = await POST(req('POST', { partyId: 'p1', action: 'make-host', userId: GUEST }));
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE (delete party)', () => {
    const del = () => DELETE(req('DELETE', undefined, 'http://localhost/api/parties/manage?partyId=p1'));

    it('lets the host delete an empty party', async () => {
      const res = await del();
      expect(res.status).toBe(200);
      const q = queries.find((x) => x.table === 'parties' && x.action === 'delete')!;
      expect(has(q, 'id', 'p1') && has(q, 'host_id', HOST)).toBe(true);
    });

    it('refuses while the pot holds money (DB or onchain)', async () => {
      party = { ...party!, pot_balance: 12 };
      expect((await del()).status).toBe(409);
      party = { ...party!, pot_balance: 0 };
      mocks.getPartyPotBalanceOnchain.mockResolvedValueOnce(0.5);
      expect((await del()).status).toBe(409);
      expect(queries.some((q) => q.table === 'parties' && q.action === 'delete')).toBe(false);
    });

    it('forbids non-hosts', async () => {
      actor = GUEST;
      expect((await del()).status).toBe(403);
      expect(queries.some(isWrite)).toBe(false);
    });
  });
});

describe('buildPartyPatch', () => {
  it('maps fields to columns and trims', () => {
    expect(buildPartyPatch({ title: ' A ', coverImage: '/uploads/x.png' })).toEqual({ patch: { title: 'A', cover_image: '/uploads/x.png' } });
  });
  it('rejects empty updates and over-long values', () => {
    expect(buildPartyPatch({}).error).toBeTruthy();
    expect(buildPartyPatch({ title: 'x'.repeat(81) }).error).toBeTruthy();
    expect(buildPartyPatch(null).error).toBeTruthy();
  });
});
