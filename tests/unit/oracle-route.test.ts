import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readContract: vi.fn(),
}));

vi.mock('@/lib/web3/monad', () => ({
  publicMonadClient: {
    readContract: mocks.readContract,
  },
}));

vi.mock('@/contracts', () => ({
  MONAD_CONTRACT_ADDRESSES: {
    pythOracle: '0x2880aB155794e7179c9eE2e38200202908C17B43',
  },
  PYTH_FEEDS: {
    monUsd: '0x31491744e2dbf6df7fcf4ac0820d18a609b49076d45066d3568424e62f686cd1',
  },
  PythOracleABI: [],
}));

import { GET } from '@/app/api/oracle/price/route';

describe('GET /api/oracle/price (Pyth Network Onchain Oracle on Monad)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully returns onchain price from Pyth Network oracle', async () => {
    mocks.readContract.mockResolvedValueOnce({
      price: BigInt(2626389),
      conf: BigInt(961),
      expo: -8,
      publishTime: BigInt(1788837891),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.price).toBeCloseTo(0.02626389, 5);
    expect(data.symbol).toBe('MON/USD');
    expect(data.source).toContain('Pyth Network');
    expect(data.contract).toBe('0x2880aB155794e7179c9eE2e38200202908C17B43');
  });

  it('gracefully provides resilient fallback if onchain query fails', async () => {
    mocks.readContract.mockRejectedValueOnce(new Error('RPC network timeout'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.price).toBeGreaterThan(0);
    expect(data.symbol).toBe('MON/USD');
    expect(data.cached).toBe(true);
  });
});
