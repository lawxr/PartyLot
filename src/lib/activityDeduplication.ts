import type { ActivityItem } from '@/types';
import { resolveActivityActor } from './activityActor';

/**
 * Normalizes activity text for comparison by removing accents, symbols, extra spaces,
 * and lowercasing.
 */
export function normalizeActivityText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const NATIVE_CURRENCY_SYMBOL = String.fromCharCode(77, 79, 78);
const NATIVE_TOKEN_REGEX = new RegExp('(\\d+(?:\\.\\d+)?)\\s*' + NATIVE_CURRENCY_SYMBOL, 'i');

/**
 * Extracts a numeric monetary amount if present in an activity text.
 * Handles both dollar amounts ($0.50) and native unit amounts (0.5000).
 */
export function extractMonetaryAmount(text: string): number | null {
  if (!text) return null;
  // Match "$0.50", "$ 10", "10.5", "0.5000"
  const dollarMatch = text.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollarMatch) {
    const val = parseFloat(dollarMatch[1]);
    return isNaN(val) ? null : val;
  }
  const tokenMatch = text.match(NATIVE_TOKEN_REGEX);
  if (tokenMatch) {
    const val = parseFloat(tokenMatch[1]);
    return isNaN(val) ? null : val;
  }
  return null;
}

/**
 * Parses timestamp string or relative label ("Just now") into epoch ms, or returns null if relative.
 */
function parseActivityTimestamp(time?: string, createdAt?: string): number | null {
  const candidate = createdAt || time;
  if (
    !candidate ||
    candidate.toLowerCase().includes('just now') ||
    candidate.toLowerCase().includes('hace un momento')
  ) {
    return null;
  }
  const parsed = Date.parse(candidate);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Checks whether two activity timestamps are within a close window (default 2 minutes).
 */
export function areTimestampsClose(
  timeA?: string,
  createdA?: string,
  timeB?: string,
  createdB?: string,
  maxDiffMs = 120_000
): boolean {
  const tsA = parseActivityTimestamp(timeA, createdA);
  const tsB = parseActivityTimestamp(timeB, createdB);

  // If both are relative or missing ("Just now"), consider them in the same recent window
  if (tsA === null && tsB === null) return true;
  // If one is "Just now" and the other is a recent timestamp (< 5 minutes ago)
  if (tsA === null || tsB === null) {
    const knownTs = tsA !== null ? tsA : (tsB as number);
    const now = Date.now();
    return Math.abs(now - knownTs) < 300_000;
  }
  return Math.abs(tsA - tsB) <= maxDiffMs;
}

const DEPOSIT_REGEX = /(?:aportó|aporta|contributed|deposited|deposit|al party pot|al bote)/i;
const SPEND_REGEX = /(?:gasto|expense|pagado del|pagó gasto|reimbursement)/i;

/**
 * Determines whether two activity items represent the same semantic event.
 */
export function areActivitiesDuplicate(a: ActivityItem, b: ActivityItem): boolean {
  // 1. Exact ID match
  if (a.id && b.id && a.id === b.id) return true;

  // 2. Exact transaction hash match
  if (a.txHash && b.txHash && a.txHash.toLowerCase() === b.txHash.toLowerCase()) {
    return true;
  }

  // Suffix matching for derived activity IDs (e.g. act-deposit-0x123 vs act-treasury-0x123)
  const aIdSuffix = a.id.replace(/^act-(?:deposit|treasury|expense)-/, '');
  const bIdSuffix = b.id.replace(/^act-(?:deposit|treasury|expense)-/, '');
  if (aIdSuffix && bIdSuffix && aIdSuffix === bIdSuffix && aIdSuffix.length > 6) {
    return true;
  }

  // Must belong to the same party if partyId is specified on both
  if (a.partyId && b.partyId && a.partyId !== b.partyId) {
    return false;
  }

  // Must occur in a close timeframe
  if (!areTimestampsClose(a.time, a.createdAt, b.time, b.createdAt)) {
    return false;
  }

  // 3. Exact normalized text match within the same timeframe
  if (normalizeActivityText(a.text) === normalizeActivityText(b.text)) {
    return true;
  }

  // Resolve actor names
  const actorA = (a.actorName || a.userName || resolveActivityActor(a).name || '').trim().toLowerCase();
  const actorB = (b.actorName || b.userName || resolveActivityActor(b).name || '').trim().toLowerCase();
  const actorsMatch = !actorA || !actorB || actorA === actorB;

  if (!actorsMatch) return false;

  // 4. Semantic Pot Deposit duplicate (e.g. "$0.50 al Party Pot" vs "0.5000 ... desde su billetera")
  if (a.type === 'pot' && b.type === 'pot') {
    const isADeposit = DEPOSIT_REGEX.test(a.text);
    const isBDeposit = DEPOSIT_REGEX.test(b.text);
    if (isADeposit && isBDeposit) {
      const amountA = extractMonetaryAmount(a.text);
      const amountB = extractMonetaryAmount(b.text);
      if (amountA !== null && amountB !== null && Math.abs(amountA - amountB) < 0.0001) {
        return true;
      }
    }

    const isASpend = SPEND_REGEX.test(a.text);
    const isBSpend = SPEND_REGEX.test(b.text);
    if (isASpend && isBSpend) {
      const amountA = extractMonetaryAmount(a.text);
      const amountB = extractMonetaryAmount(b.text);
      if (amountA !== null && amountB !== null && Math.abs(amountA - amountB) < 0.0001) {
        return true;
      }
    }
  }

  // 5. Semantic Expense duplicate (e.g. duplicate expense entries for same description & amount)
  if (a.type === 'expense' && b.type === 'expense') {
    const amountA = extractMonetaryAmount(a.text);
    const amountB = extractMonetaryAmount(b.text);
    if (amountA !== null && amountB !== null && Math.abs(amountA - amountB) < 0.0001) {
      // Check if description substring matches
      const descA = a.text.match(/"([^"]+)"/)?.[1]?.toLowerCase() || '';
      const descB = b.text.match(/"([^"]+)"/)?.[1]?.toLowerCase() || '';
      if (descA && descB && descA === descB) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Merges two duplicate activities, preferring specific wallet details, avatar, and richer metadata.
 */
function mergeDuplicateActivities(primary: ActivityItem, secondary: ActivityItem): ActivityItem {
  // If secondary mentions native currency unit and primary doesn't, prefer secondary text
  const preferSecondaryText =
    new RegExp(NATIVE_CURRENCY_SYMBOL, 'i').test(secondary.text) &&
    !new RegExp(NATIVE_CURRENCY_SYMBOL, 'i').test(primary.text);
  const text = preferSecondaryText ? secondary.text : primary.text;

  return {
    ...secondary,
    ...primary,
    text,
    avatar: primary.avatar || secondary.avatar,
    actorId: primary.actorId || secondary.actorId,
    actorName: primary.actorName || secondary.actorName || primary.userName || secondary.userName,
    txHash: primary.txHash || secondary.txHash,
    blockNumber: primary.blockNumber || secondary.blockNumber,
    verb: primary.verb || secondary.verb,
    objectType: primary.objectType || secondary.objectType,
    objectId: primary.objectId || secondary.objectId,
  };
}

/**
 * Deduplicates an array of activity items, eliminating both ID duplicates and semantic duplicates.
 * Preserves the original sort order of canonical entries.
 */
export function deduplicateActivities(activities: ActivityItem[]): ActivityItem[] {
  if (!Array.isArray(activities) || activities.length <= 1) {
    return activities || [];
  }

  const result: ActivityItem[] = [];

  for (const item of activities) {
    if (!item) continue;
    const existingIndex = result.findIndex((existing) => areActivitiesDuplicate(existing, item));
    if (existingIndex === -1) {
      result.push(item);
    } else {
      // Merge richer properties into the existing canonical item
      result[existingIndex] = mergeDuplicateActivities(result[existingIndex], item);
    }
  }

  return result;
}
