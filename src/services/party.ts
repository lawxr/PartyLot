import { Party } from '@/types';

/**
 * Generates an uppercase 4-character invite code (e.g. 8F4K)
 */
export function generatePartyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Resolves a party by 4-letter code (case-insensitive)
 */
export function findPartyByCode(parties: Party[], code: string): Party | undefined {
  const normalized = code.trim().toUpperCase();
  return parties.find(p => p.code.toUpperCase() === normalized);
}

/**
 * Formats a shareable party invite text for native clipboard / WhatsApp / iMessage
 */
export function formatPartyInviteText(party: Party): string {
  return `You're invited to ${party.title}! 🍸\n\nWhen: ${party.date} · ${party.time}\nWhere: ${party.location}\nPrivate Code: ${party.code}\n\nJoin on Partylot: https://partylot.app/join?code=${party.code}`;
}
