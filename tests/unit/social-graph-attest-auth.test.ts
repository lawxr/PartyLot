import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  writeContract: vi.fn(),
  createWalletClient: vi.fn(),
  getServerSupabase: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  privateKeyToAccount: vi.fn(),
  checkRateLimit: vi.fn(),
  verifyPrivyToken: vi.fn(),
}));

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createWalletClient: mocks.createWalletClient,
    http: vi.fn(() => ({})),
    keccak256: vi.fn(() => `0x${'1'.repeat(64)}`),
    toHex: vi.fn((value: string) => value),
  };
});

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: mocks.privateKeyToAccount,
}));

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: mocks.getServerSupabase,
}));

vi.mock('@/contracts', () => ({
  MONAD_CONTRACT_ADDRESSES: { socialGraph: `0x${'3'.repeat(40)}` },
  SocialGraphABI: [],
}));

vi.mock('@/lib/web3/monad', () => ({
  publicMonadClient: {
    waitForTransactionReceipt: mocks.waitForTransactionReceipt,
    readContract: mocks.readContract,
  },
  getMonadExplorerTxUrl: vi.fn((txHash: string) => `https://testnet.monadexplorer.com/tx/${txHash}`),
  monadTestnet: { id: 10143 },
}));

vi.mock('@/lib/security/rateLimit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock('@/lib/auth/serverPrivy', () => ({
  verifyPrivyToken: mocks.verifyPrivyToken,
}));

describe('POST /api/social-graph/attest (Authentication & Security Hardening)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MONAD_DEPLOYER_PRIVATE_KEY = `0x${'a'.repeat(64)}`;
    mocks.checkRateLimit.mockReturnValue({ allowed: true });
    mocks.privateKeyToAccount.mockReturnValue({
      address: `0x${'4'.repeat(40)}`,
    });
    mocks.createWalletClient.mockReturnValue({
      writeContract: mocks.writeContract,
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects with 429 when rate limit is exceeded', async () => {
    mocks.checkRateLimit.mockReturnValue({ allowed: false });
    const { POST } = await import('@/app/api/social-graph/attest/route');

    const req = new NextRequest('http://localhost/api/social-graph/attest', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('rejects unauthenticated request in production with 401', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    const { POST } = await import('@/app/api/social-graph/attest/route');

    const req = new NextRequest('http://localhost/api/social-graph/attest', {
      method: 'POST',
      body: JSON.stringify({ partyId: 'party_123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('rejects unauthenticated request in development when REQUIRE_AUTH_IN_DEV=true', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    process.env.REQUIRE_AUTH_IN_DEV = 'true';
    const { POST } = await import('@/app/api/social-graph/attest/route');

    const req = new NextRequest('http://localhost/api/social-graph/attest', {
      method: 'POST',
      body: JSON.stringify({ partyId: 'party_123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('rejects invalid Bearer token with 401', async () => {
    mocks.verifyPrivyToken.mockRejectedValue(new Error('Invalid token'));
    const { POST } = await import('@/app/api/social-graph/attest/route');

    const req = new NextRequest('http://localhost/api/social-graph/attest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer bad_token_123',
      },
      body: JSON.stringify({ partyId: 'party_123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('verifies valid Bearer token and validates required body parameters', async () => {
    mocks.verifyPrivyToken.mockResolvedValue({ userId: 'user_xyz' });
    const { POST } = await import('@/app/api/social-graph/attest/route');

    const req = new NextRequest('http://localhost/api/social-graph/attest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid_token_xyz',
      },
      body: JSON.stringify({ partyId: 'party_123' }), // Missing participant identifiers
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('INVALID_INPUT');
  });
});
