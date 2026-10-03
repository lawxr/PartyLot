import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  executeEnvioQuery,
  fetchEnvioActivities,
  fetchEnvioUserReputation,
  fetchEnvioGlobalMetrics,
  checkEnvioSyncStatus,
} from '@/lib/web3/envio';
import * as fs from 'fs';
import * as path from 'path';

describe('Envio HyperIndex Client & Integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('executeEnvioQuery', () => {
    it('returns data when GraphQL returns a 200 with data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { test: 'hello_envio' },
        }),
      });

      const result = await executeEnvioQuery<{ test: string }>('{ test }');
      expect(result).toEqual({ test: 'hello_envio' });
    });

    it('returns null and fails gracefully when fetch throws', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const result = await executeEnvioQuery('{ test }');
      expect(result).toBeNull();
    });

    it('returns null when response status is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await executeEnvioQuery('{ test }');
      expect(result).toBeNull();
    });

    it('returns null when GraphQL response contains errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Field not found' }],
        }),
      });

      const result = await executeEnvioQuery('{ test }');
      expect(result).toBeNull();
    });
  });

  describe('fetchEnvioActivities', () => {
    it('parses and returns activity items from Envio', async () => {
      const mockItems = [
        {
          id: 'act-1',
          partyId: 'party-101',
          actor: '0x123',
          target: null,
          type: 'DEPOSIT',
          title: 'Pot Deposit: +5.000 MON',
          subtitle: 'Contributed by 0x123...',
          amount: '5000000000000000000',
          blockNumber: 120500,
          blockTimestamp: 1727800000,
          transactionHash: '0xabc123',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { ActivityFeedItem: mockItems },
        }),
      });

      const activities = await fetchEnvioActivities('party-101', 10);
      expect(activities).toHaveLength(1);
      expect(activities[0].title).toBe('Pot Deposit: +5.000 MON');
      expect(activities[0].transactionHash).toBe('0xabc123');
    });

    it('returns empty array when indexer returns no activities or fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { ActivityFeedItem: [] },
        }),
      });

      const activities = await fetchEnvioActivities();
      expect(activities).toEqual([]);
    });
  });

  describe('fetchEnvioUserReputation', () => {
    it('normalizes wei values to MON and computes reputation correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            UserReputationSummary_by_pk: {
              userAddress: '0xuser1',
              totalPartiesJoined: 5,
              totalDepositedAmount: '10000000000000000000', // 10 MON
              totalSettledAmount: '5000000000000000000', // 5 MON
              totalRewardsEarned: '2000000000000000000', // 2 MON
              reputationScore: 165,
              lastActiveTimestamp: 1727800000,
            },
          },
        }),
      });

      const rep = await fetchEnvioUserReputation('0xUser1');
      expect(rep).not.toBeNull();
      expect(rep?.totalPartiesJoined).toBe(5);
      expect(rep?.totalDepositedMon).toBe('10.00');
      expect(rep?.totalSettledMon).toBe('5.00');
      expect(rep?.totalRewardsMon).toBe('2.00');
      expect(rep?.reputationScore).toBe(165);
    });

    it('returns null if user is not yet indexed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { UserReputationSummary_by_pk: null },
        }),
      });

      const rep = await fetchEnvioUserReputation('0xUnknown');
      expect(rep).toBeNull();
    });
  });

  describe('fetchEnvioGlobalMetrics', () => {
    it('normalizes global network metrics from Envio', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            GlobalMetrics_by_pk: {
              totalPartiesCreated: 12,
              totalMemberships: 48,
              totalMonVolumeIndexed: '150000000000000000000', // 150 MON
              totalSettlementsExecuted: 30,
              lastIndexedBlock: 120550,
              lastIndexedTimestamp: 1727800500,
            },
          },
        }),
      });

      const metrics = await fetchEnvioGlobalMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics?.totalPartiesCreated).toBe(12);
      expect(metrics?.totalMemberships).toBe(48);
      expect(metrics?.totalMonVolumeIndexed).toBe('150.00');
      expect(metrics?.totalSettlementsExecuted).toBe(30);
      expect(metrics?.lastIndexedBlock).toBe(120550);
    });
  });

  describe('checkEnvioSyncStatus', () => {
    it('returns healthy status when blocks are synchronized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            GlobalMetrics_by_pk: {
              lastIndexedBlock: 100,
            },
          },
        }),
      });

      const status = await checkEnvioSyncStatus();
      expect(status.isRealtime).toBe(true);
      expect(['healthy', 'syncing']).toContain(status.indexerStatus);
      expect(status.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Envio Indexer Artifacts Validation', () => {
    const rootDir = process.cwd();

    it('verifies indexer/config.yaml exists and targets Monad Testnet 10143', () => {
      const configPath = path.join(rootDir, 'indexer', 'config.yaml');
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf8');
      expect(content).toContain('10143'); // Monad Testnet Chain ID
      expect(content).toContain('PartyRegistry');
      expect(content).toContain('PartyTreasury');
      expect(content).toContain('SocialGraph');
      expect(content).toContain('https://testnet-rpc.monad.xyz');
    });

    it('verifies indexer/schema.graphql contains required non-trivial entities', () => {
      const schemaPath = path.join(rootDir, 'indexer', 'schema.graphql');
      expect(fs.existsSync(schemaPath)).toBe(true);

      const content = fs.readFileSync(schemaPath, 'utf8');
      expect(content).toContain('type Party');
      expect(content).toContain('type TreasuryDeposit');
      expect(content).toContain('type DebtSettlement');
      expect(content).toContain('type UserReputationSummary');
      expect(content).toContain('type GlobalMetrics');
      expect(content).toContain('type SocialTie');
      expect(content).toContain('type ActivityFeedItem');
    });

    it('verifies contract ABIs are present and valid JSON', () => {
      const abis = ['PartyRegistry.json', 'PartyTreasury.json', 'SocialGraph.json'];
      for (const file of abis) {
        const abiPath = path.join(rootDir, 'indexer', 'abis', file);
        expect(fs.existsSync(abiPath)).toBe(true);
        const parsed = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        expect(Array.isArray(parsed)).toBe(true);
      }
    });
  });
});
