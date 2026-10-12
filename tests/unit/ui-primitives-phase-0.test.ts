import { describe, it, expect } from 'vitest';
import { formatRelativeTime, formatShortRelativeTime } from '@/lib/time';
import { translations } from '@/lib/i18n/translations';

describe('Phase 0 Foundation Primitives', () => {
  describe('Relative Time Formatting', () => {
    it('formats recent timestamps in Spanish and English', () => {
      const now = new Date();
      expect(formatRelativeTime(now, 'es')).toBe('hace un momento');
      expect(formatRelativeTime(now, 'en')).toBe('just now');

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo, 'es')).toBe('hace 5m');
      expect(formatRelativeTime(fiveMinutesAgo, 'en')).toBe('5m ago');

      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
      expect(formatRelativeTime(threeHoursAgo, 'es')).toBe('hace 3h');
      expect(formatRelativeTime(threeHoursAgo, 'en')).toBe('3h ago');
    });

    it('formats short timestamps', () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      expect(formatShortRelativeTime(twoMinutesAgo, 'es')).toBe('2m');
      expect(formatShortRelativeTime(twoMinutesAgo, 'en')).toBe('2m');
    });
  });

  describe('Consumer Glossary Keys', () => {
    it('has consumer glossary defined for Spanish and English', () => {
      expect(translations.es.glossary.partyPot).toBe('Bote de la fiesta');
      expect(translations.en.glossary.partyPot).toBe('Party Pot');
      expect(translations.es.glossary.saveToHistory).toBe('Guardar en la historia del crew');
      expect(translations.en.glossary.saveToHistory).toBe('Save to crew history');
      expect(translations.es.glossary.spentTogether).toBe('Gastado juntos');
      expect(translations.en.glossary.spentTogether).toBe('Spent together');
    });

    it('recap avoids crypto jargon and uses consumer copy', () => {
      expect(translations.es.recap.attest).not.toMatch(/monad/i);
      expect(translations.en.recap.attest).not.toMatch(/monad/i);
      expect(translations.es.recap.totalDamage).toBe('GASTADO JUNTOS');
      expect(translations.en.recap.totalDamage).toBe('SPENT TOGETHER');
    });

    it('nav translations provide accessible standard labels', () => {
      expect(translations.es.nav.home).toBe('Inicio');
      expect(translations.en.nav.home).toBe('Home');
      expect(translations.es.nav.crews).toBe('Crews');
      expect(translations.en.nav.crews).toBe('Crews');
      expect(translations.es.nav.activity).toBe('Actividad');
      expect(translations.en.nav.activity).toBe('Activity');
      expect(translations.es.nav.profile).toBe('Perfil');
      expect(translations.en.nav.profile).toBe('Profile');
    });

    it('formats member counts for 0, 1, and many members gracefully', () => {
      expect(translations.es.home.membersCount(0)).toBe('0 miembros');
      expect(translations.en.home.membersCount(0)).toBe('0 members');
      expect(translations.es.home.membersCount(1)).toBe('1 miembro');
      expect(translations.en.home.membersCount(1)).toBe('1 member');
      expect(translations.es.home.membersCount(200)).toBe('200 miembros');
      expect(translations.en.home.membersCount(200)).toBe('200 members');
    });
  });
});
