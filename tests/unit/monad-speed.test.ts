import { describe, it, expect } from 'vitest';
import {
  publicMonadClient,
  createMonadPublicClient,
  MONAD_BLOCK_TIME_MS,
  MONAD_POLLING_INTERVAL_MS,
  MONAD_TESTNET_CONFIG,
  monadTestnet,
} from '@/lib/web3/monad';

describe('Monad Speed & Viem Polling Optimization (Part 3)', () => {
  it('defines correct Monad native block cadence and polling constants', () => {
    // Monad target block cadence is ~400ms
    expect(MONAD_BLOCK_TIME_MS).toBe(400);

    // Optimized sub-second polling interval matched to Monad blocks (overriding Viem 4000ms default)
    expect(MONAD_POLLING_INTERVAL_MS).toBe(500);
  });

  it('configures publicMonadClient with 500ms polling interval instead of 4000ms default', () => {
    expect(publicMonadClient.pollingInterval).toBe(500);
  });

  it('createMonadPublicClient factory instantiates clients with 500ms polling default', () => {
    const customClient = createMonadPublicClient();
    expect(customClient.pollingInterval).toBe(500);
    expect(customClient.chain.id).toBe(10143);
  });

  it('createMonadPublicClient allows custom polling interval override', () => {
    const fastClient = createMonadPublicClient({ pollingInterval: 250 });
    expect(fastClient.pollingInterval).toBe(250);
  });

  it('MONAD_TESTNET_CONFIG reflects block time and polling cadence', () => {
    expect(MONAD_TESTNET_CONFIG.chainId).toBe(10143);
    expect(MONAD_TESTNET_CONFIG.currencySymbol).toBe('MON');
    expect(MONAD_TESTNET_CONFIG.blockTimeMs).toBe(400);
    expect(MONAD_TESTNET_CONFIG.pollingIntervalMs).toBe(500);
  });

  it('monadTestnet chain has expected network properties', () => {
    expect(monadTestnet.id).toBe(10143);
    expect(monadTestnet.nativeCurrency.symbol).toBe('MON');
    expect(monadTestnet.nativeCurrency.decimals).toBe(18);
    expect(monadTestnet.testnet).toBe(true);
  });
});
