import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  writeContract: vi.fn(),
  createWalletClient: vi.fn(),
  getServerSupabase: vi.fn(),
  insert: vi.fn(),
  getBlockNumber: vi.fn(),
  getBalance: vi.fn(),
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
    parseEther: vi.fn(() => BigInt(1)),
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
    waitForTransactionReceipt: mocks.waitForTransactionReceipt,
  },
  getMonadExplorerTxUrl: vi.fn(() => 'https://testnet.monadexplorer.com/tx/0x123'),
  monadTestnet: {},
}));
vi.mock('@/lib/security/rateLimit', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('@/lib/auth/serverPrivy', () => ({ verifyPrivyToken: mocks.verifyPrivyToken }));

import { POST } from '@/app/api/treasury/action/route';

describe('POST /api/treasury/action (Fail-Closed Multi-Party Treasury)', () => {
  beforeEach(() => {
    vi.stubEnv('MONAD_DEPLOYER_PRIVATE_KEY', `0x${'a'.repeat(64)}`);
    mocks.writeContract.mockRejectedValue(new Error('simulated contract failure'));
    mocks.createWalletClient.mockReturnValue({ writeContract: mocks.writeContract });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.getServerSupabase.mockReturnValue({ from: vi.fn(() => ({ insert: mocks.insert })) });
    mocks.getBlockNumber.mockResolvedValue(BigInt(65_050_100));
    mocks.getBalance.mockResolvedValue(BigInt('100000000000000000000'));
    mocks.waitForTransactionReceipt.mockResolvedValue({ status: 'success', blockNumber: BigInt(65_050_100) });
    mocks.privateKeyToAccount.mockReturnValue({ address: `0x${'3'.repeat(40)}` });
    mocks.checkRateLimit.mockReturnValue({ allowed: true });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it.each(['deposit', 'reward', 'reimbursement', 'spend', 'rollover', 'settle'])(
    'fails closed and returns 502 for %s when contract execution fails',
    async (action) => {
      const request = new NextRequest('http://localhost/api/treasury/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          partyId: 'party-42',
          amount: 1,
          userAddress: `0x${'4'.repeat(40)}`,
          recipientAddress: `0x${'5'.repeat(40)}`,
          recipientName: 'Test recipient',
          description: 'Regression test only',
        }),
      });

      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(502);
      expect(payload).toEqual({
        success: false,
        error: 'TRANSACTION_FAILED',
        message: 'simulated contract failure',
      });
      expect(mocks.createWalletClient).toHaveBeenCalled();
      expect(mocks.writeContract).toHaveBeenCalled();
      // Supabase persistent state must NOT be written on failure
      expect(mocks.insert).not.toHaveBeenCalled();
    }
  );

  it('succeeds and records persistent activity when contract execution succeeds', async () => {
    const fakeTxHash = `0x${'f'.repeat(64)}`;
    mocks.writeContract.mockResolvedValue(fakeTxHash);
    mocks.waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: BigInt(65_050_200),
    });

    const request = new NextRequest('http://localhost/api/treasury/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'deposit',
        partyId: 'party-real-monad',
        amount: 2.5,
        userAddress: `0x${'4'.repeat(40)}`,
        userName: 'Satoshi',
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.txHash).toBe(fakeTxHash);
    expect(payload.token).toBe('MON');
    expect(payload.network).toBe('Monad Testnet');
    expect(mocks.insert).toHaveBeenCalled();
  });

  it('returns 500 when deployer private key is missing or invalid', async () => {
    vi.stubEnv('MONAD_DEPLOYER_PRIVATE_KEY', '');
    const request = new NextRequest('http://localhost/api/treasury/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'deposit', partyId: 'party-1', amount: 1 }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('CONFIG_ERROR');
  });

  it('returns 400 for malformed json or missing partyId', async () => {
    const request = new NextRequest('http://localhost/api/treasury/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid-json',
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('INVALID_REQUEST');
  });

  it('returns 400 when deployer balance is insufficient for deposit', async () => {
    mocks.getBalance.mockResolvedValue(BigInt(0));
    const request = new NextRequest('http://localhost/api/treasury/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'deposit', partyId: 'party-1', amount: 10 }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('INSUFFICIENT_FUNDS');
  });
});
