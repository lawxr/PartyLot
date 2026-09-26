import { describe, it, expect } from 'vitest';
import { generatePartyCode, findPartyByCode, formatPartyInviteText } from '@/services/party';
import type { Party } from '@/types';

describe('Party Service', () => {
  describe('generatePartyCode', () => {
    it('generates a 4-character uppercase alphanumeric code', () => {
      const code = generatePartyCode();
      expect(code).toHaveLength(4);
      expect(code).toMatch(/^[A-Z0-9]{4}$/);
    });

    it('does not contain easily confused characters (I, O, 0, 1)', () => {
      // Test across multiple generations
      for (let i = 0; i < 50; i++) {
        const code = generatePartyCode();
        expect(code).not.toMatch(/[IO01]/);
      }
    });

    it('generates pseudo-random codes across invocations', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 20; i++) {
        codes.add(generatePartyCode());
      }
      // With 20 samples, we should have multiple distinct codes
      expect(codes.size).toBeGreaterThan(15);
    });
  });

  describe('findPartyByCode', () => {
    const mockParties: Party[] = [
      {
        id: 'p1',
        code: 'VIBE',
        title: 'Rooftop Chill',
        date: '2026-10-01',
        time: '20:00',
        location: 'Downtown Loft',
        description: 'Drinks and music',
        coverImage: 'cover1.jpg',
        hostId: 'h1',
        hostName: 'Alice',
        members: [],
        potBalance: 0,
        createdAt: new Date().toISOString(),
        status: 'upcoming',
      },
      {
        id: 'p2',
        code: 'COOL',
        title: 'Pool Party',
        date: '2026-10-02',
        time: '14:00',
        location: 'Sunset Villa',
        description: 'Swimming and BBQ',
        coverImage: 'cover2.jpg',
        hostId: 'h2',
        hostName: 'Bob',
        members: [],
        potBalance: 0,
        createdAt: new Date().toISOString(),
        status: 'upcoming',
      },
    ];

    it('finds party by exact matching code', () => {
      const party = findPartyByCode(mockParties, 'VIBE');
      expect(party).toBeDefined();
      expect(party?.id).toBe('p1');
    });

    it('is case-insensitive and trims surrounding whitespace', () => {
      const partyLower = findPartyByCode(mockParties, 'vibe');
      expect(partyLower?.id).toBe('p1');

      const partyWithSpaces = findPartyByCode(mockParties, '  COOL  ');
      expect(partyWithSpaces?.id).toBe('p2');
    });

    it('returns undefined when code does not match any party', () => {
      const party = findPartyByCode(mockParties, 'NOPE');
      expect(party).toBeUndefined();
    });
  });

  describe('formatPartyInviteText', () => {
    it('formats a shareable invite message containing key event info and invite URL', () => {
      const mockParty: Party = {
        id: 'p1',
        code: 'PARTY',
        title: 'Neon Night',
        date: 'Oct 15',
        time: '9:00 PM',
        location: 'Club Nova',
        description: 'Electronic music',
        coverImage: 'neon.jpg',
        hostId: 'h1',
        hostName: 'Alice',
        members: [],
        potBalance: 0,
        createdAt: new Date().toISOString(),
        status: 'upcoming',
      };

      const text = formatPartyInviteText(mockParty);
      expect(text).toContain("You're invited to Neon Night! 🍸");
      expect(text).toContain('When: Oct 15 · 9:00 PM');
      expect(text).toContain('Where: Club Nova');
      expect(text).toContain('Private Code: PARTY');
      expect(text).toContain('https://partylot.app/join?code=PARTY');
    });
  });
});
