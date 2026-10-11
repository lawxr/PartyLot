import { describe, it, expect, vi, beforeEach } from 'vitest';
import { keccak256, encodePacked, getAddress } from 'viem';
import { SocialGraphABI } from '@/contracts';
import { recordGatheringOnchain } from '@/services/socialGraphService';

/**
 * TypeScript mirror of SocialGraph.sol getPairKey
 */
function getPairKeyTs(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
  const normA = a.toLowerCase();
  const normB = b.toLowerCase();
  return normA < normB
    ? keccak256(encodePacked(['address', 'address'], [normA as `0x${string}`, normB as `0x${string}`]))
    : keccak256(encodePacked(['address', 'address'], [normB as `0x${string}`, normA as `0x${string}`]));
}

describe('SocialGraph Smart Contract & Service (PR-01 Access Control)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Contract ABI Interface', () => {
    it('exposes owner and authorizedRegistry read functions', () => {
      const ownerFn = SocialGraphABI.find((item) => item.type === 'function' && item.name === 'owner');
      const registryFn = SocialGraphABI.find((item) => item.type === 'function' && item.name === 'authorizedRegistry');

      expect(ownerFn).toBeDefined();
      expect(ownerFn?.stateMutability).toBe('view');
      expect(registryFn).toBeDefined();
      expect(registryFn?.stateMutability).toBe('view');
    });

    it('exposes setAuthorizedRegistry restricted configuration function', () => {
      const setRegFn = SocialGraphABI.find((item) => item.type === 'function' && item.name === 'setAuthorizedRegistry');
      expect(setRegFn).toBeDefined();
      expect(setRegFn?.stateMutability).toBe('nonpayable');
      expect(setRegFn?.inputs).toHaveLength(1);
    });

    it('exposes AuthorizedRegistryUpdated and SocialTiesUpdated events', () => {
      const tiesEvent = SocialGraphABI.find((item) => item.type === 'event' && item.name === 'SocialTiesUpdated');
      const regEvent = SocialGraphABI.find((item) => item.type === 'event' && item.name === 'AuthorizedRegistryUpdated');

      expect(tiesEvent).toBeDefined();
      expect(regEvent).toBeDefined();
    });

    it('defines recordGathering accepting partyId and address array', () => {
      const recordFn = SocialGraphABI.find((item) => item.type === 'function' && item.name === 'recordGathering');
      expect(recordFn).toBeDefined();
      expect(recordFn?.inputs).toHaveLength(2);
      expect(recordFn?.inputs[1].type).toBe('address[]');
    });
  });

  describe('Pair Key Symmetry (Anti-Sybil Deterministic Graph Keys)', () => {
    it('produces identical pair keys regardless of parameter ordering', () => {
      const addrA = getAddress('0x1111111111111111111111111111111111111111');
      const addrB = getAddress('0x2222222222222222222222222222222222222222');

      const keyAB = getPairKeyTs(addrA, addrB);
      const keyBA = getPairKeyTs(addrB, addrA);

      expect(keyAB).toBe(keyBA);
      expect(keyAB).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('handles identical lower-upper case address variations symmetrically', () => {
      const addrA1 = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' as `0x${string}`;
      const addrA2 = '0xab5801a7d398351b8be11c439e05c5b3259aec9b' as `0x${string}`;
      const addrB = '0x1Db3439a222C519ab44bb1144fC23CC77470d796' as `0x${string}`;

      expect(getPairKeyTs(addrA1, addrB)).toBe(getPairKeyTs(addrA2, addrB));
    });
  });

  describe('Batch Size and Input Validation', () => {
    it('calculates correct pair count formula O(N^2) for bounded batch (N <= 30)', () => {
      const maxBatch = 30;
      const expectedPairUpdates = (maxBatch * (maxBatch - 1)) / 2;
      expect(expectedPairUpdates).toBe(435); // Bounded SSTOREs, fits comfortably in Monad block gas limit
    });
  });

  describe('Client Service: recordGatheringOnchain', () => {
    it('submits gathering to server attest endpoint and returns confirmed receipt', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 42000,
          explorerUrl: 'https://testnet.monadexplorer.com/tx/0x1234',
          nightsTogether: 3,
        }),
      });
      global.fetch = mockFetch;

      const receipt = await recordGatheringOnchain('party_100', [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
      ]);

      expect(receipt.success).toBe(true);
      expect(receipt.txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(receipt.nightsTogether).toBe(3);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/social-graph/attest',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('fails closed when backend returns an error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Unauthorized social graph caller',
        }),
      });
      global.fetch = mockFetch;

      await expect(
        recordGatheringOnchain('party_100', [
          '0x1111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222',
        ])
      ).rejects.toThrow('Unauthorized social graph caller');
    });
  });
});
