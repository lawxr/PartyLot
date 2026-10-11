import { describe, it, expect } from 'vitest';
import { calculateReputation, hasReputationPrivilege, REPUTATION_TIERS } from '@/lib/reputation';

describe('SocialGraph Reputation Engine (Objective 3)', () => {
  describe('calculateReputation tier calculations', () => {
    it('assigns newcomer tier for 0 gatherings or nights', () => {
      const rep = calculateReputation(0, 0);
      expect(rep.tier).toBe('newcomer');
      expect(rep.tierName).toBe('Newcomer');
      expect(rep.tierNameEs).toBe('Recién Llegado');
      expect(rep.effectiveNights).toBe(0);
      expect(rep.nextTierNights).toBe(1);
      expect(rep.progressToNext).toBe(0);
      expect(rep.score).toBe(0);
    });

    it('assigns initiate tier for 1-2 gatherings or nights', () => {
      const rep = calculateReputation(1, 1);
      expect(rep.tier).toBe('initiate');
      expect(rep.tierName).toBe('Party Initiate');
      expect(rep.tierNameEs).toBe('Iniciado de Fiesta');
      expect(rep.effectiveNights).toBe(1);
      expect(rep.nextTierNights).toBe(3);
      expect(rep.progressToNext).toBe(0); // (1 - 1)/(3 - 1) = 0%
      expect(rep.unlockedPerks).toContain('View shared crew memories & vault');

      const rep2 = calculateReputation(2, 2);
      expect(rep2.tier).toBe('initiate');
      expect(rep2.progressToNext).toBe(50); // (2 - 1)/(3 - 1) = 50%
    });

    it('assigns regular tier for 3-4 gatherings with pot voting perks', () => {
      const rep = calculateReputation(3, 3);
      expect(rep.tier).toBe('regular');
      expect(rep.tierName).toBe('Crew Regular');
      expect(rep.tierNameEs).toBe('Habitual de la Crew');
      expect(rep.effectiveNights).toBe(3);
      expect(rep.nextTierNights).toBe(5);
      expect(rep.progressToNext).toBe(0); // (3 - 3)/(5 - 3) = 0%
      expect(rep.unlockedPerks).toContain('Vote on Party Pot bounty distribution');

      const rep4 = calculateReputation(4, 4);
      expect(rep4.tier).toBe('regular');
      expect(rep4.progressToNext).toBe(50); // (4 - 3)/(5 - 3) = 50%
    });

    it('assigns inner_circle tier for 5-9 gatherings with party proposal perks', () => {
      const rep = calculateReputation(5, 5);
      expect(rep.tier).toBe('inner_circle');
      expect(rep.tierName).toBe('Inner Circle');
      expect(rep.tierNameEs).toBe('Círculo Íntimo');
      expect(rep.effectiveNights).toBe(5);
      expect(rep.nextTierNights).toBe(10);
      expect(rep.progressToNext).toBe(0); // (5 - 5)/(10 - 5) = 0%
      expect(rep.unlockedPerks).toContain('Propose and schedule new parties to crew');

      const rep7 = calculateReputation(7, 7);
      expect(rep7.tier).toBe('inner_circle');
      expect(rep7.progressToNext).toBe(40); // (7 - 5)/(10 - 5) = 40%
    });

    it('assigns og_legend tier for 10+ gatherings with 100% progress and no next tier', () => {
      const rep = calculateReputation(10, 10);
      expect(rep.tier).toBe('og_legend');
      expect(rep.tierName).toBe('OG Crew Legend');
      expect(rep.tierNameEs).toBe('Leyenda OG');
      expect(rep.effectiveNights).toBe(10);
      expect(rep.nextTierNights).toBeNull();
      expect(rep.progressToNext).toBe(100);
      expect(rep.unlockedPerks).toContain('VIP onchain badge on profile');

      const rep25 = calculateReputation(25, 25);
      expect(rep25.tier).toBe('og_legend');
      expect(rep25.nextTierNights).toBeNull();
      expect(rep25.progressToNext).toBe(100);
    });

    it('handles negative or invalid values gracefully and fails safe to 0', () => {
      const rep = calculateReputation(-5, -2);
      expect(rep.tier).toBe('newcomer');
      expect(rep.effectiveNights).toBe(0);
      expect(rep.score).toBe(0);
    });
  });

  describe('hasReputationPrivilege access control checks', () => {
    it('verifies view_memories privilege threshold', () => {
      expect(hasReputationPrivilege(0, 'view_memories')).toBe(false);
      expect(hasReputationPrivilege(1, 'view_memories')).toBe(true);
      expect(hasReputationPrivilege(5, 'view_memories')).toBe(true);
    });

    it('verifies vote_pot governance privilege threshold', () => {
      expect(hasReputationPrivilege(2, 'vote_pot')).toBe(false);
      expect(hasReputationPrivilege(3, 'vote_pot')).toBe(true);
      expect(hasReputationPrivilege(10, 'vote_pot')).toBe(true);
    });

    it('verifies propose_parties privilege threshold', () => {
      expect(hasReputationPrivilege(4, 'propose_parties')).toBe(false);
      expect(hasReputationPrivilege(5, 'propose_parties')).toBe(true);
      expect(hasReputationPrivilege(8, 'propose_parties')).toBe(true);
    });

    it('verifies og_badge privilege threshold', () => {
      expect(hasReputationPrivilege(9, 'og_badge')).toBe(false);
      expect(hasReputationPrivilege(10, 'og_badge')).toBe(true);
      expect(hasReputationPrivilege(20, 'og_badge')).toBe(true);
    });
  });

  describe('REPUTATION_TIERS metadata constants', () => {
    it('contains all 5 canonical tiers with localized definitions', () => {
      const tiers = Object.keys(REPUTATION_TIERS);
      expect(tiers).toHaveLength(5);
      expect(tiers).toEqual(['newcomer', 'initiate', 'regular', 'inner_circle', 'og_legend']);

      Object.values(REPUTATION_TIERS).forEach((tier) => {
        expect(tier.name).toBeTruthy();
        expect(tier.nameEs).toBeTruthy();
        expect(tier.perks.length).toBeGreaterThan(0);
        expect(tier.perksEs.length).toBeGreaterThan(0);
      });
    });
  });
});
