/**
 * Time and date formatting utilities for Partylot.
 * Standardizes relative timestamps across feeds, activities, and memories.
 */

export type SupportedLocale = 'es' | 'en';

export function formatRelativeTime(
  timestamp?: string | number | Date | null,
  locale: SupportedLocale = 'es'
): string {
  if (!timestamp) {
    return locale === 'es' ? 'hace un momento' : 'just now';
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) {
    return String(timestamp).slice(0, 10);
  }

  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffSec < 60) {
    return locale === 'es' ? 'hace un momento' : 'just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return locale === 'es' ? `hace ${diffMin}m` : `${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return locale === 'es' ? `hace ${diffHours}h` : `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return locale === 'es' ? `hace ${diffDays}d` : `${diffDays}d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return locale === 'es' ? `hace ${diffWeeks} sem` : `${diffWeeks}w ago`;
  }

  // Older than a month: show month and day
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatShortRelativeTime(
  timestamp?: string | number | Date | null,
  locale: SupportedLocale = 'es'
): string {
  if (!timestamp) return '1m';

  const str = String(timestamp).trim();
  if (str === 'Just now' || str === 'Ahora') return '1m';
  if (/^\d+[mhd]\s*(ago)?$/i.test(str)) return str.replace(/\s*ago/i, '');

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return str.slice(0, 5);

  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffSec < 60) return '1m';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}
