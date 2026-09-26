import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateServerInviteCode,
  joinPartyWithInviteCode,
} from '@/services/supabaseService';

describe('Invite Validation & Party Join Client (Stage 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateServerInviteCode', () => {
    it('returns invalid without network call when code is empty or whitespace', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const resEmpty = await validateServerInviteCode('');
      expect(resEmpty.valid).toBe(false);
      expect(resEmpty.error).toContain('Invite code cannot be empty');

      const resSpaces = await validateServerInviteCode('   ');
      expect(resSpaces.valid).toBe(false);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('fails closed when network fetch throws', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

      const res = await validateServerInviteCode('CODE');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('unreachable');
    });

    it('fails closed when backend returns 400 or valid: false', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({ valid: false, error: 'Expired invite' }),
      } as Response);

      const res = await validateServerInviteCode('EXPD');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Expired invite');
    });

    it('returns party details on valid backend response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          party_id: 'p-123',
          party_title: 'Summer Splash',
          party_location: 'Beachfront Villa',
        }),
      } as Response);

      const res = await validateServerInviteCode('SUMM');
      expect(res.valid).toBe(true);
      expect(res.partyId).toBe('p-123');
      expect(res.partyTitle).toBe('Summer Splash');
    });
  });

  describe('joinPartyWithInviteCode', () => {
    it('fails closed immediately when authToken is missing or null', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const res = await joinPartyWithInviteCode('CODE', null);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Authentication is required');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('fails closed when join endpoint returns error status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'INVITE_EXPIRED', message: 'Invite has expired' }),
      } as Response);

      const res = await joinPartyWithInviteCode('CODE', 'fake-token-123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Invite has expired');
    });

    it('fails closed when network throws during join', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection reset'));

      const res = await joinPartyWithInviteCode('CODE', 'fake-token-123');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Joining is unavailable');
    });
  });
});
