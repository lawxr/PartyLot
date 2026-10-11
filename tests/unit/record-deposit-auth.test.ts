import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getServerSupabase: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  checkRateLimit: vi.fn(),
  verifyPrivyToken: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: mocks.getServerSupabase,
}));

vi.mock('@/lib/web3/monad', () => ({
  publicMonadClient: {
    waitForTransactionReceipt: mocks.waitForTransactionReceipt,
  },
}));

vi.mock('@/lib/security/rateLimit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock('@/lib/auth/serverPrivy', () => ({
  verifyPrivyToken: mocks.verifyPrivyToken,
}));

describe('POST /api/treasury/record-deposit (Security & Fail-Closed Receipts)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mocks.checkRateLimit.mockReturnValue({ allowed: true });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects unauthenticated request when REQUIRE_AUTH_IN_DEV=true', async () => {
    process.env.NODE_ENV = 'development';
    process.env.REQUIRE_AUTH_IN_DEV = 'true';
    const { POST } = await import('@/app/api/treasury/record-deposit/route');

    const req = new NextRequest('http://localhost/api/treasury/record-deposit', {
      method: 'POST',
      body: JSON.stringify({
        partyId: 'party-1',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        amount: 5,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('fails closed when transaction receipt is unconfirmed or null', async () => {
    mocks.verifyPrivyToken.mockResolvedValue({ userId: 'u1' });
    mocks.waitForTransactionReceipt.mockResolvedValue(null);
    const { POST } = await import('@/app/api/treasury/record-deposit/route');

    const req = new NextRequest('http://localhost/api/treasury/record-deposit', {
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: JSON.stringify({
        partyId: 'party-1',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        amount: 5,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('TX_UNCONFIRMED');
  });

  it('fails closed when transaction reverted onchain', async () => {
    mocks.verifyPrivyToken.mockResolvedValue({ userId: 'u1' });
    mocks.waitForTransactionReceipt.mockResolvedValue({ status: 'reverted' });
    const { POST } = await import('@/app/api/treasury/record-deposit/route');

    const req = new NextRequest('http://localhost/api/treasury/record-deposit', {
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: JSON.stringify({
        partyId: 'party-1',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        amount: 5,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('TX_REVERTED');
  });
});
