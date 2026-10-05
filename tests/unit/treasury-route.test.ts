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
  getBlockNumber: vi.fn(),
  getBalance: vi.fn(),
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  privateKeyToAccount: vi.fn(),
  checkRateLimit: vi.fn(),
  verifyPrivyToken: vi.fn(),
  parseEther: vi.fn((value: string) => {
    if (value === 'NaN') throw new Error('Invalid ether amount');
    return BigInt(1);
  }),
}));

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createWalletClient: mocks.createWalletClient,
    http: vi.fn(() => ({})),
    keccak256: vi.fn(() => `0x${'1'.repeat(64)}`),
    parseEther: mocks.parseEther,
    formatEther: vi.fn((val: bigint) => (Number(val) / 1e18).toFixed(4)),
    toHex: vi.fn((value: string) => value),
  };
});

vi.mock('viem/accounts', () => ({ privateKeyToAccount: mocks.privateKeyToAccount }));
vi.mock('@/lib/supabase/server', () => ({ getServerSupabase: mocks.getServerSupabase }));
vi.mock('@/contracts', () => ({
  MONAD_CONTRACT_ADDRESSES: { partyTreasury: `0x${'2'.repeat(40)}` },
  PartyTreasuryABI: [],
}));
vi.mock('@/lib/web3/monad', () => ({
  publicMonadClient: {
    getBlockNumber: mocks.getBlockNumber,
    getBalance: mocks.getBalance,
    readContract: mocks.readContract,
    waitForTransactionReceipt: mocks.waitForTransactionReceipt,
  },
  getMonadExplorerTxUrl: vi.fn(() => 'https://testnet.monadexplorer.com/tx/0x123'),
  monadTestnet: {},
}));
vi.mock('@/lib/security/rateLimit', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('@/lib/auth/serverPrivy', () => ({ verifyPrivyToken: mocks.verifyPrivyToken }));

import { POST } from '@/app/api/treasury/action/route';

describe('POST /api/treasury/action (Fail-Closed Multi-Party Treasury)', () => {
  const hostWallet = `0x${'4'.repeat(40)}`;
  const authHeaders = { authorization: 'Bearer verified-token', 'content-type': 'application/json' };

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('MONAD_DEPLOYER_PRIVATE_KEY', `0x${'a'.repeat(64)}`);
    mocks.writeContract.mockRejectedValue(new Error('simulated contract failure'));
    mocks.createWalletClient.mockReturnValue({ writeContract: mocks.writeContract });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.select.mockImplementation(() => ({ eq: mocks.eq }));
    mocks.eq.mockImplementation(() => ({ single: mocks.single }));
    mocks.single.mockResolvedValue({ data: { host_id: 'host-user' }, error: null });
    mocks.getServerSupabase.mockReturnValue({ from: vi.fn(() => ({ insert: mocks.insert, select: mocks.select })) });
    mocks.getBlockNumber.mockResolvedValue(BigInt(65_050_100));
    mocks.getBalance.mockResolvedValue(BigInt('100000000000000000000'));
    mocks.readContract.mockResolvedValue([hostWallet, BigInt(0), BigInt(0), BigInt(0), true]);
    mocks.waitForTransactionReceipt.mockResolvedValue({ status: 'success', blockNumber: BigInt(65_050_100) });
    mocks.privateKeyToAccount.mockReturnValue({ address: `0x${'3'.repeat(40)}` });
    mocks.checkRateLimit.mockReturnValue({ allowed: true });
    mocks.verifyPrivyToken.mockResolvedValue({ userId: 'host-user', walletAddress: hostWallet });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  const request = (body: unknown, headers: Record<string, string> = authHeaders) => new NextRequest('http://localhost/api/treasury/action', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  it.each(['reward', 'reimbursement', 'spend', 'rollover', 'register'])(
    'returns a truthful failed receipt for %s when contract execution fails',
    async (action) => {
      if (action === 'register') {
        mocks.readContract.mockResolvedValue([hostWallet, BigInt(0), BigInt(0), BigInt(0), false]);
      }
      const response = await POST(request({
        action,
        partyId: 'party-42',
        toPartyId: 'party-43',
        amount: 1,
        recipientAddress: `0x${'5'.repeat(40)}`,
      }));
      const payload = await response.json();

      expect(response.status).toBe(502);
      expect(payload).toEqual({ success: false, error: 'TRANSACTION_FAILED', message: 'simulated contract failure' });
      expect(mocks.createWalletClient).toHaveBeenCalled();
      expect(mocks.writeContract).toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
    }
  );

  it.each(['deposit', 'settle'])(
    'rejects relayer-funded %s before signing, RPC, or persistence, even with an authenticated arbitrary recipient',
    async (action) => {
      const response = await POST(request({ action, partyId: 'party-42', amount: 1, recipientAddress: `0x${'9'.repeat(40)}` }));
      const payload = await response.json();

      expect(response.status).toBe(503);
      expect(payload.success).toBe(false);
      expect(mocks.privateKeyToAccount).not.toHaveBeenCalled();
      expect(mocks.createWalletClient).not.toHaveBeenCalled();
      expect(mocks.writeContract).not.toHaveBeenCalled();
      expect(mocks.getBalance).not.toHaveBeenCalled();
      expect(mocks.readContract).not.toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
    }
  );

  it('requires a bearer token in production before checking signer configuration', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MONAD_DEPLOYER_PRIVATE_KEY', '');
    const response = await POST(request(
      { action: 'reward', partyId: 'party-42', amount: 1 },
      { 'content-type': 'application/json' },
    ));

    expect(response.status).toBe(401);
    expect(mocks.privateKeyToAccount).not.toHaveBeenCalled();
    expect(mocks.createWalletClient).not.toHaveBeenCalled();
    expect(mocks.getBalance).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('requires an authenticated actor in test mode too', async () => {
    const response = await POST(request(
      { action: 'reward', partyId: 'party-42', amount: 1 },
      { 'content-type': 'application/json' },
    ));

    expect(response.status).toBe(401);
    expect(mocks.privateKeyToAccount).not.toHaveBeenCalled();
    expect(mocks.createWalletClient).not.toHaveBeenCalled();
    expect(mocks.writeContract).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['missing party row', { data: null, error: { message: 'not found' } }],
    ['missing host id', { data: { host_id: null }, error: null }],
    ['lookup error', { data: null, error: { message: 'database unavailable' } }],
  ])('fails closed on %s without signing, RPC, or persistence', async (_caseName, result) => {
    mocks.single.mockResolvedValue(result);
    const response = await POST(request({ action: 'reward', partyId: 'party-42', amount: 1 }));

    expect(response.status).toBe(503);
    expect(mocks.privateKeyToAccount).not.toHaveBeenCalled();
    expect(mocks.createWalletClient).not.toHaveBeenCalled();
    expect(mocks.getBalance).not.toHaveBeenCalled();
    expect(mocks.readContract).not.toHaveBeenCalled();
    expect(mocks.writeContract).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('fails closed when the authorization database lookup throws', async () => {
    mocks.getServerSupabase.mockImplementation(() => { throw new Error('database unavailable'); });
    const response = await POST(request({ action: 'rollover', partyId: 'party-42', toPartyId: 'party-43' }));

    expect(response.status).toBe(503);
    expect(mocks.privateKeyToAccount).not.toHaveBeenCalled();
    expect(mocks.createWalletClient).not.toHaveBeenCalled();
    expect(mocks.getBalance).not.toHaveBeenCalled();
    expect(mocks.readContract).not.toHaveBeenCalled();
    expect(mocks.writeContract).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('rejects non-host actors before signing, RPC, or persistence', async () => {
    mocks.verifyPrivyToken.mockResolvedValue({ userId: 'different-user', walletAddress: `0x${'6'.repeat(40)}` });
    const response = await POST(request({ action: 'spend', partyId: 'party-42', amount: 1 }));

    expect(response.status).toBe(403);
    expect(mocks.privateKeyToAccount).not.toHaveBeenCalled();
    expect(mocks.createWalletClient).not.toHaveBeenCalled();
    expect(mocks.getBalance).not.toHaveBeenCalled();
    expect(mocks.readContract).not.toHaveBeenCalled();
    expect(mocks.writeContract).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('registers only with the verified host wallet, ignoring a caller-provided recipient', async () => {
    mocks.writeContract.mockResolvedValue(`0x${'b'.repeat(64)}`);
    mocks.readContract.mockResolvedValue([hostWallet, BigInt(0), BigInt(0), BigInt(0), false]);
    const response = await POST(request({ action: 'register', partyId: 'party-42', recipientAddress: `0x${'9'.repeat(40)}` }));

    expect(response.status).toBe(200);
    expect(mocks.writeContract).toHaveBeenCalledWith(expect.objectContaining({
      functionName: 'registerParty',
      args: [expect.any(String), hostWallet],
    }));
  });

  it('allows an authenticated host rollover without an amount and skips MON amount parsing', async () => {
    mocks.writeContract.mockResolvedValue(`0x${'c'.repeat(64)}`);
    const response = await POST(request({ action: 'rollover', partyId: 'party-42', toPartyId: 'party-43' }));

    expect(response.status).toBe(200);
    expect(mocks.writeContract).toHaveBeenCalledWith(expect.objectContaining({ functionName: 'rolloverToNextParty' }));
    expect(mocks.parseEther).not.toHaveBeenCalled();
  });

  it('preserves authorized host distribution and records activity after a confirmed receipt', async () => {
    const fakeTxHash = `0x${'f'.repeat(64)}`;
    mocks.writeContract.mockResolvedValue(fakeTxHash);
    const response = await POST(request({ action: 'reward', partyId: 'party-real-monad', amount: 2.5, recipientAddress: hostWallet }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.txHash).toBe(fakeTxHash);
    expect(payload.token).toBe('MON');
    expect(payload.network).toBe('Monad Testnet');
    expect(mocks.insert).toHaveBeenCalled();
  });

  it.each([
    ['missing', null],
    ['pending', { status: 'pending', blockNumber: BigInt(65_050_200) }],
    ['reverted', { status: 'reverted', blockNumber: BigInt(65_050_200) }],
  ])('does not claim or persist success for a %s transaction receipt', async (_caseName, receipt) => {
    mocks.writeContract.mockResolvedValue(`0x${'f'.repeat(64)}`);
    mocks.waitForTransactionReceipt.mockResolvedValue(receipt);
    const response = await POST(request({ action: 'reward', partyId: 'party-42', amount: 1, recipientAddress: hostWallet }));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({ success: false, error: 'TRANSACTION_FAILED' });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed json or missing partyId', async () => {
    const malformed = new NextRequest('http://localhost/api/treasury/action', {
      method: 'POST', headers: authHeaders, body: '{invalid-json',
    });
    const response = await POST(malformed);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('INVALID_REQUEST');
  });
});
