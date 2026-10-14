import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { encodeAbiParameters, encodeEventTopics, parseEther } from 'viem';
import { MONAD_CONTRACT_ADDRESSES, PartyTreasuryABI } from '@/contracts';
import { toPartyBytes32 } from '@/lib/web3/monad';

const mocks = vi.hoisted(() => ({
  getServerSupabase: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  checkRateLimit: vi.fn(),
  verifyPrivyToken: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: mocks.getServerSupabase,
}));

vi.mock('@/lib/web3/monad', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/web3/monad')>();
  return {
    ...actual,
    publicMonadClient: {
      waitForTransactionReceipt: mocks.waitForTransactionReceipt,
    },
  };
});

vi.mock('@/lib/security/rateLimit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock('@/lib/auth/serverPrivy', () => ({
  verifyPrivyToken: mocks.verifyPrivyToken,
}));

function createDepositLog(partyId: string, member: `0x${string}`, amountMon: string, newBalanceMon: string) {
  const topics = encodeEventTopics({
    abi: PartyTreasuryABI,
    eventName: 'Deposited',
    args: {
      partyId: toPartyBytes32(partyId),
      member,
    },
  });

  const data = encodeAbiParameters(
    [{ type: 'uint256' }, { type: 'uint256' }],
    [parseEther(amountMon), parseEther(newBalanceMon)]
  );

  return {
    address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
    topics,
    data,
    blockNumber: BigInt(123456),
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  };
}

describe('POST /api/treasury/record-deposit (Event Verification & Durable Persistence)', () => {
  const originalEnv = { ...process.env };
  const testTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const testMember = '0x1111111111111111111111111111111111111111' as `0x${string}`;

  type MockSupabaseClient = {
    from: (table: string) => Record<string, unknown>;
  };

  let mockSupabase: MockSupabaseClient;
  let partyRecord: { id: string; pot_balance: number };
  let potTransactions: Array<Record<string, unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mocks.checkRateLimit.mockReturnValue({ allowed: true });
    mocks.verifyPrivyToken.mockResolvedValue({ userId: 'u-1' });

    partyRecord = { id: 'party-test-1', pot_balance: 10 };
    potTransactions = [];

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'parties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(async () => ({
                  data: partyRecord ? { ...partyRecord } : null,
                  error: partyRecord ? null : { message: 'Party not found' },
                })),
              }),
            }),
            update: vi.fn().mockImplementation((updates: { pot_balance: number }) => ({
              eq: vi.fn().mockImplementation(async (_col: string, id: string) => {
                if (partyRecord && partyRecord.id === id) {
                  partyRecord.pot_balance = updates.pot_balance;
                  return { error: null };
                }
                return { error: { message: 'Update failed' } };
              }),
            })),
          };
        }
        if (table === 'pot_transactions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockImplementation(async () => {
                  const existing = potTransactions.find((t) => t.id === `pot-tx-${testTxHash.slice(2, 16)}`);
                  return { data: existing || null, error: null };
                }),
              }),
            }),
            upsert: vi.fn().mockImplementation(async (payload: Record<string, unknown>) => {
              potTransactions.push(payload);
              return { error: null };
            }),
            insert: vi.fn().mockImplementation(async (payload: Record<string, unknown>) => {
              potTransactions.push(payload);
              return { error: null };
            }),
          };
        }
        if (table === 'activities') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    };

    mocks.getServerSupabase.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('derives confirmedAmount and sender from onchain Deposited event even when client amount is spoofed', async () => {
    const log = createDepositLog('party-test-1', testMember, '3.5', '13.5');
    mocks.waitForTransactionReceipt.mockResolvedValueOnce({
      status: 'success',
      to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      from: testMember,
      blockNumber: BigInt(123456),
      logs: [log],
    });

    const { POST } = await import('@/app/api/treasury/record-deposit/route');
    const req = new NextRequest('http://localhost/api/treasury/record-deposit', {
      method: 'POST',
      headers: { authorization: 'Bearer token-1' },
      body: JSON.stringify({
        partyId: 'party-test-1',
        txHash: testTxHash,
        amount: 999, // Attacker sends spoofed 999 MON
        userName: 'Alice',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Real onchain amount was 3.5 MON; party started at 10 MON -> updated balance must be 13.5, NOT 1009
    expect(data.amount).toBe(3.5);
    expect(data.updatedBalance).toBe(13.5);
    expect(partyRecord.pot_balance).toBe(13.5);
  });

  it('rejects when transaction receipt has no Deposited event (NO_DEPOSIT_EVENT)', async () => {
    mocks.waitForTransactionReceipt.mockResolvedValueOnce({
      status: 'success',
      to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      from: testMember,
      blockNumber: BigInt(123456),
      logs: [], // Empty logs
    });

    const { POST } = await import('@/app/api/treasury/record-deposit/route');
    const req = new NextRequest('http://localhost/api/treasury/record-deposit', {
      method: 'POST',
      headers: { authorization: 'Bearer token-1' },
      body: JSON.stringify({
        partyId: 'party-test-1',
        txHash: testTxHash,
        amount: 5,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('NO_DEPOSIT_EVENT');
  });

  it('rejects when Deposited event partyId does not match the requested party (WRONG_PARTY_EVENT)', async () => {
    // Log emitted for a different party: 'other-party'
    const log = createDepositLog('other-party', testMember, '5.0', '15.0');
    mocks.waitForTransactionReceipt.mockResolvedValueOnce({
      status: 'success',
      to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      from: testMember,
      blockNumber: BigInt(123456),
      logs: [log],
    });

    const { POST } = await import('@/app/api/treasury/record-deposit/route');
    const req = new NextRequest('http://localhost/api/treasury/record-deposit', {
      method: 'POST',
      headers: { authorization: 'Bearer token-1' },
      body: JSON.stringify({
        partyId: 'party-test-1',
        txHash: testTxHash,
        amount: 5,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('WRONG_PARTY_EVENT');
  });

  it('prevents replay / double-spending on duplicate submission', async () => {
    const log = createDepositLog('party-test-1', testMember, '2.0', '12.0');
    mocks.waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      from: testMember,
      blockNumber: BigInt(123456),
      logs: [log],
    });

    const { POST } = await import('@/app/api/treasury/record-deposit/route');
    const sendReq = () =>
      new NextRequest('http://localhost/api/treasury/record-deposit', {
        method: 'POST',
        headers: { authorization: 'Bearer token-1' },
        body: JSON.stringify({
          partyId: 'party-test-1',
          txHash: testTxHash,
          amount: 2,
        }),
      });

    // First call succeeds
    const res1 = await POST(sendReq());
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.duplicate).toBeUndefined();
    expect(partyRecord.pot_balance).toBe(12.0);

    // Second call is idempotent duplicate
    const res2 = await POST(sendReq());
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.duplicate).toBe(true);
    // Balance not inflated again
    expect(partyRecord.pot_balance).toBe(12.0);
  });

  it('returns PERSISTENCE_FAILED with fail-closed message when database update fails', async () => {
    const log = createDepositLog('party-test-1', testMember, '5.0', '15.0');
    mocks.waitForTransactionReceipt.mockResolvedValueOnce({
      status: 'success',
      to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
      from: testMember,
      blockNumber: BigInt(123456),
      logs: [log],
    });

    // Make database update fail
    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: partyRecord,
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Database connection failed' },
            }),
          }),
        };
      }
      if (table === 'pot_transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const { POST } = await import('@/app/api/treasury/record-deposit/route');
    const req = new NextRequest('http://localhost/api/treasury/record-deposit', {
      method: 'POST',
      headers: { authorization: 'Bearer token-1' },
      body: JSON.stringify({
        partyId: 'party-test-1',
        txHash: testTxHash,
        amount: 5,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('PERSISTENCE_FAILED');
    expect(data.onchainConfirmed).toBe(true);
    expect(data.txHash).toBe(testTxHash);
    // Explicitly warns user NOT to send another wallet transaction
    expect(data.message).toContain('Do NOT send another wallet transaction');
  });
});
