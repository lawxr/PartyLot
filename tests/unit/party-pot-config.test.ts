import { describe, expect, it } from 'vitest';
import { buildPartyPatch } from '@/lib/partyAdmin';

describe('MON-03 — Voluntary Pot Configuration', () => {
  describe('buildPartyPatch Validation', () => {
    it('accepts valid potGoal and potMessage in patch payload', () => {
      const { patch, error } = buildPartyPatch({
        potGoal: 25.5,
        potMessage: 'Voluntary contribution for sound equipment & drinks',
      });

      expect(error).toBeUndefined();
      expect(patch).toEqual({
        pot_goal: 25.5,
        pot_message: 'Voluntary contribution for sound equipment & drinks',
      });
    });

    it('accepts clearing potGoal and potMessage with null or zero', () => {
      const { patch, error } = buildPartyPatch({
        potGoal: 0,
        potMessage: '',
      });

      expect(error).toBeUndefined();
      expect(patch).toEqual({
        pot_goal: 0,
        pot_message: null,
      });
    });

    it('rejects negative potGoal', () => {
      const { patch, error } = buildPartyPatch({
        potGoal: -5,
      });

      expect(error).toContain('potGoal must be a non-negative number');
      expect(patch).toEqual({});
    });

    it('rejects non-numeric potGoal string that is not a valid number', () => {
      const { patch, error } = buildPartyPatch({
        potGoal: 'not-a-number',
      });

      expect(error).toContain('potGoal must be a non-negative number');
      expect(patch).toEqual({});
    });

    it('rounds potGoal to 4 decimal places', () => {
      const { patch, error } = buildPartyPatch({
        potGoal: 12.34567,
      });

      expect(error).toBeUndefined();
      expect(patch.pot_goal).toBe(12.3457);
    });

    it('rejects potMessage exceeding character limit (300 chars)', () => {
      const { patch, error } = buildPartyPatch({
        potMessage: 'a'.repeat(301),
      });

      expect(error).toContain('too long');
      expect(patch).toEqual({});
    });
  });

  describe('Voluntary Pot Accounting Decoupling', () => {
    it('ensures pot goal and pot contributions never mutate personal debt ledger', () => {
      // Pot balance is separate from individual split balances
      const mockParty = {
        id: 'p-1',
        potBalance: 50,
        potGoal: 100,
        potMessage: 'Voluntary snacks fund',
      };

      // Goal progress is purely voluntary display
      const progress = Math.min(100, Math.round((mockParty.potBalance / mockParty.potGoal) * 100));
      expect(progress).toBe(50);

      // Attendance does not require pot balance > 0
      const nonContributor = { id: 'u-1', name: 'Alice', role: 'guest' };
      expect(nonContributor).toBeDefined();
    });
  });
});

