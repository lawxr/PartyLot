import { describe, it, expect } from 'vitest';
import { generateMetadata } from '@/app/join/[code]/page';
import { extractPartyCode } from '@/components/ui/QRScannerModal';
import { formatPartyInviteText } from '@/services/party';
import type { Party } from '@/types';

describe('Clean /join/[code] Routing & Deep-Link System (Objective 4)', () => {
  describe('generateMetadata for dynamic /join/[code]', () => {
    it('generates rich metadata with normalized uppercase code', async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ code: '8f4k' }),
      });

      expect(meta.title).toBe('Únete a la fiesta (8F4K) | PartyLot');
      expect(meta.description).toContain('8F4K');
      expect(meta.openGraph?.title).toContain('8F4K');
      expect(meta.openGraph?.url).toBe('https://partylot.vercel.app/join/8F4K');
    });

    it('handles encoded and spaces gracefully in code parameter', async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ code: '%20party-99%20' }),
      });

      expect(meta.title).toBe('Únete a la fiesta (PARTY-99) | PartyLot');
    });
  });

  describe('QR scanner extractPartyCode support for path-based URLs', () => {
    it('extracts invite code from clean path-based URL (/join/8F4K)', () => {
      expect(extractPartyCode('https://partylot.vercel.app/join/8F4K')).toBe('8F4K');
      expect(extractPartyCode('http://localhost:3000/join/crew')).toBe('CREW');
      expect(extractPartyCode('/join/99AA')).toBe('99AA');
    });

    it('extracts invite code from legacy query-param URL (/join?code=8F4K)', () => {
      expect(extractPartyCode('https://partylot.vercel.app/join?code=8F4K')).toBe('8F4K');
      expect(extractPartyCode('https://partylot.vercel.app/join?join=77BB')).toBe('77BB');
    });

    it('extracts bare alphanumeric 4-character codes', () => {
      expect(extractPartyCode('8F4K')).toBe('8F4K');
      expect(extractPartyCode('  8f4k  ')).toBe('8F4K');
    });

    it('returns null on empty or invalid text', () => {
      expect(extractPartyCode('')).toBeNull();
      expect(extractPartyCode('xyz')).toBeNull();
    });
  });

  describe('formatPartyInviteText in party service', () => {
    it('formats party invite message with clean path URL', () => {
      const mockParty: Party = {
        id: 'p-1',
        code: 'VIP8',
        title: 'Monad Launch Party',
        date: '2026-10-20',
        time: '20:00',
        location: 'Miami Crypto Center',
        description: 'Celebrating Metropolis',
        coverImage: '',
        hostId: 'h-1',
        hostName: 'Gabriela',
        members: [],
        potBalance: 10,
        createdAt: new Date().toISOString(),
        status: 'upcoming',
      };

      const inviteText = formatPartyInviteText(mockParty);
      expect(inviteText).toContain('Monad Launch Party');
      expect(inviteText).toContain('Private Code: VIP8');
      expect(inviteText).toContain('https://partylot.vercel.app/join/VIP8');
      expect(inviteText).not.toContain('?code=');
    });
  });
});
