import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deduplicateActivities,
  areActivitiesDuplicate,
  extractMonetaryAmount,
  normalizeActivityText,
} from '@/lib/activityDeduplication';
import type { ActivityItem } from '@/types';
import { usePartyStore } from '@/store/usePartyStore';

describe('Activity Deduplication & Idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractMonetaryAmount & normalizeActivityText', () => {
    it('correctly extracts dollar amounts from various string formats', () => {
      expect(extractMonetaryAmount('PartyMember aportó $0.50 al Party Pot')).toBe(0.5);
      expect(extractMonetaryAmount('Added expense: "Pizza" ($25.00)')).toBe(25);
      expect(extractMonetaryAmount('$10.75 contributed')).toBe(10.75);
    });

    it('correctly extracts MON token amounts from strings', () => {
      expect(
        extractMonetaryAmount('PartyMember aportó 0.5000 MON al Party Pot desde su billetera')
      ).toBe(0.5);
      expect(extractMonetaryAmount('Deposit of 1.25 MON on Monad')).toBe(1.25);
    });

    it('returns null when no monetary pattern exists', () => {
      expect(extractMonetaryAmount('PartyMember joined the party')).toBeNull();
    });

    it('normalizes activity text by stripping diacritics, emojis, and casing', () => {
      const normalized = normalizeActivityText('  🎉 José aportó $0.50  ');
      expect(normalized).toBe('jose aporto $0.50');
    });
  });

  describe('areActivitiesDuplicate', () => {
    it('detects duplicate activities by identical ID', () => {
      const a1: ActivityItem = {
        id: 'act-1',
        partyId: 'p-1',
        type: 'pot',
        text: 'Deposit',
        time: 'Just now',
      };
      const a2: ActivityItem = {
        id: 'act-1',
        partyId: 'p-1',
        type: 'pot',
        text: 'Deposit',
        time: 'Just now',
      };
      expect(areActivitiesDuplicate(a1, a2)).toBe(true);
    });

    it('detects duplicate activities by identical onchain txHash', () => {
      const a1: ActivityItem = {
        id: 'act-local-1',
        partyId: 'p-1',
        type: 'pot',
        text: 'Client text',
        time: 'Just now',
        txHash: '0xabc123def456',
      };
      const a2: ActivityItem = {
        id: 'act-server-2',
        partyId: 'p-1',
        type: 'pot',
        text: 'Server text',
        time: 'Just now',
        txHash: '0xabc123def456',
      };
      expect(areActivitiesDuplicate(a1, a2)).toBe(true);
    });

    it('detects duplicate activities between client deposit and server onchain treasury deposit (exact user issue)', () => {
      const clientActivity: ActivityItem = {
        id: 'act-1728774000000',
        partyId: 'party-test-1',
        type: 'pot',
        text: 'PartyMember aportó $0.50 al Party Pot',
        time: 'Just now',
        actorName: 'PartyMember',
      };

      const serverActivity: ActivityItem = {
        id: 'act-treasury-1728774000500',
        partyId: 'party-test-1',
        type: 'pot',
        text: 'PartyMember aportó 0.5000 MON al Party Pot desde su billetera',
        time: 'Just now',
        actorName: 'PartyMember',
      };

      expect(areActivitiesDuplicate(clientActivity, serverActivity)).toBe(true);
    });

    it('does not flag activities for different parties as duplicates', () => {
      const a1: ActivityItem = {
        id: 'act-1',
        partyId: 'party-A',
        type: 'pot',
        text: 'PartyMember aportó $0.50 al Party Pot',
        time: 'Just now',
      };
      const a2: ActivityItem = {
        id: 'act-2',
        partyId: 'party-B',
        type: 'pot',
        text: 'PartyMember aportó $0.50 al Party Pot',
        time: 'Just now',
      };
      expect(areActivitiesDuplicate(a1, a2)).toBe(false);
    });

    it('does not flag activities with different amounts as duplicates', () => {
      const a1: ActivityItem = {
        id: 'act-1',
        partyId: 'party-A',
        type: 'pot',
        text: 'PartyMember aportó $0.50 al Party Pot',
        time: 'Just now',
      };
      const a2: ActivityItem = {
        id: 'act-2',
        partyId: 'party-A',
        type: 'pot',
        text: 'PartyMember aportó $5.00 al Party Pot',
        time: 'Just now',
      };
      expect(areActivitiesDuplicate(a1, a2)).toBe(false);
    });

    it('does not flag activities from different days as duplicates even if amount is identical', () => {
      const a1: ActivityItem = {
        id: 'act-1',
        partyId: 'party-A',
        type: 'pot',
        text: 'PartyMember aportó $0.50 al Party Pot',
        time: '2026-10-01T12:00:00.000Z',
        createdAt: '2026-10-01T12:00:00.000Z',
      };
      const a2: ActivityItem = {
        id: 'act-2',
        partyId: 'party-A',
        type: 'pot',
        text: 'PartyMember aportó $0.50 al Party Pot',
        time: '2026-10-05T12:00:00.000Z',
        createdAt: '2026-10-05T12:00:00.000Z',
      };
      expect(areActivitiesDuplicate(a1, a2)).toBe(false);
    });
  });

  describe('deduplicateActivities', () => {
    it('collapses parallel client & server deposit activities into a single canonical notification', () => {
      const feed: ActivityItem[] = [
        {
          id: 'act-client-1',
          partyId: 'party-1',
          type: 'pot',
          text: 'PartyMember aportó $0.50 al Party Pot',
          time: 'Just now',
          avatar: 'https://avatar.png',
        },
        {
          id: 'act-server-1',
          partyId: 'party-1',
          type: 'pot',
          text: 'PartyMember aportó 0.5000 MON al Party Pot desde su billetera',
          time: 'Just now',
          avatar: 'https://avatar.png',
        },
      ];

      const deduplicated = deduplicateActivities(feed);
      expect(deduplicated).toHaveLength(1);
      // Prefer the more specific MON token record text
      expect(deduplicated[0].text).toContain('0.5000 MON');
      expect(deduplicated[0].avatar).toBe('https://avatar.png');
    });

    it('deduplicates duplicate expenses while preserving unique ones', () => {
      const feed: ActivityItem[] = [
        {
          id: 'act-exp-1',
          partyId: 'p-1',
          type: 'expense',
          text: 'Alice added [FOOD] expense: "Tacos" ($30.00)',
          time: 'Just now',
        },
        {
          id: 'act-exp-duplicate',
          partyId: 'p-1',
          type: 'expense',
          text: 'Alice added [FOOD] expense: "Tacos" ($30.00)',
          time: 'Just now',
        },
        {
          id: 'act-exp-2',
          partyId: 'p-1',
          type: 'expense',
          text: 'Bob added [DRINKS] expense: "Beer" ($15.00)',
          time: 'Just now',
        },
      ];

      const deduplicated = deduplicateActivities(feed);
      expect(deduplicated).toHaveLength(2);
      expect(deduplicated[0].text).toContain('Tacos');
      expect(deduplicated[1].text).toContain('Beer');
    });
  });

  describe('usePartyStore Activity Deduplication Integration', () => {
    it('deduplicates incoming activities when loadPartyFromSupabase runs with existing activities', () => {
      usePartyStore.setState({
        activities: [
          {
            id: 'act-local',
            partyId: 'p-10',
            type: 'pot',
            text: 'PartyMember aportó $0.50 al Party Pot',
            time: 'Just now',
            actorName: 'PartyMember',
          },
        ],
      });

      // Simulate remote fetch with duplicate server entry
      const remoteActivities: ActivityItem[] = [
        {
          id: 'act-treasury-10',
          partyId: 'p-10',
          type: 'pot',
          text: 'PartyMember aportó 0.5000 MON al Party Pot desde su billetera',
          time: 'Just now',
          actorName: 'PartyMember',
        },
      ];

      const merged = deduplicateActivities([
        ...remoteActivities,
        ...usePartyStore.getState().activities,
      ]);

      expect(merged).toHaveLength(1);
      expect(merged[0].text).toContain('0.5000 MON');
    });
  });
});
