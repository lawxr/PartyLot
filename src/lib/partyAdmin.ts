/**
 * Pure helpers for host party administration (shared by /api/parties/manage and tests).
 */

export const LIMITS = {
  title: 80,
  location: 140,
  description: 600,
  date: 40,
  time: 20,
  coverImage: 1000,
  potMessage: 300,
} as const;

type TextEditableField = keyof typeof LIMITS;
type EditableField = TextEditableField | 'potGoal';

const EDITABLE: EditableField[] = [
  'title',
  'date',
  'time',
  'location',
  'description',
  'coverImage',
  'potGoal',
  'potMessage',
];

const DB_COLUMN: Record<EditableField, string> = {
  title: 'title',
  date: 'date',
  time: 'time',
  location: 'location',
  description: 'description',
  coverImage: 'cover_image',
  potGoal: 'pot_goal',
  potMessage: 'pot_message',
};

/** Validates and normalises an edit payload. Returns the DB patch or an error message. */
export function buildPartyPatch(updates: unknown): { patch: Record<string, unknown>; error?: string } {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return { patch: {}, error: 'updates must be an object.' };
  const patch: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(updates as Record<string, unknown>)) {
    if (!EDITABLE.includes(key as EditableField)) return { patch: {}, error: `Field "${key}" cannot be edited.` };

    if (key === 'potGoal') {
      if (raw === null || raw === '' || raw === 0) {
        patch[DB_COLUMN.potGoal] = 0;
        continue;
      }
      const num = typeof raw === 'number' ? raw : parseFloat(String(raw).trim());
      if (isNaN(num) || num < 0 || !Number.isFinite(num)) {
        return { patch: {}, error: 'potGoal must be a non-negative number.' };
      }
      patch[DB_COLUMN.potGoal] = Number(num.toFixed(4));
      continue;
    }

    if (key === 'potMessage') {
      if (raw === null || raw === '') {
        patch[DB_COLUMN.potMessage] = null;
        continue;
      }
      if (typeof raw !== 'string') {
        return { patch: {}, error: 'Field "potMessage" must be text.' };
      }
      const trimmed = raw.trim();
      if (trimmed.length > LIMITS.potMessage) {
        return { patch: {}, error: 'Field "potMessage" is too long.' };
      }
      patch[DB_COLUMN.potMessage] = trimmed || null;
      continue;
    }

    if (typeof raw !== 'string') return { patch: {}, error: `Field "${key}" must be text.` };
    const value = raw.trim();
    const field = key as TextEditableField;
    if ((field === 'title' || field === 'location' || field === 'date' || field === 'time') && !value) {
      return { patch: {}, error: `Field "${key}" cannot be empty.` };
    }
    if (value.length > LIMITS[field]) return { patch: {}, error: `Field "${key}" is too long.` };
    if (field === 'coverImage' && value && !/^(https:\/\/|\/)/.test(value)) {
      return { patch: {}, error: 'coverImage must be an https URL or an uploaded file path.' };
    }
    patch[DB_COLUMN[field]] = value;
  }

  if (!Object.keys(patch).length) return { patch: {}, error: 'Nothing to update.' };
  return { patch };
}

