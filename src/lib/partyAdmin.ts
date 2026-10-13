/**
 * Pure helpers for host party administration (shared by /api/parties/manage and tests).
 */

export const LIMITS = { title: 80, location: 140, description: 600, date: 40, time: 20, coverImage: 1000 } as const;
type EditableField = keyof typeof LIMITS;
const EDITABLE: EditableField[] = ['title', 'date', 'time', 'location', 'description', 'coverImage'];
const DB_COLUMN: Record<EditableField, string> = {
  title: 'title',
  date: 'date',
  time: 'time',
  location: 'location',
  description: 'description',
  coverImage: 'cover_image',
};

/** Validates and normalises an edit payload. Returns the DB patch or an error message. */
export function buildPartyPatch(updates: unknown): { patch: Record<string, string>; error?: string } {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return { patch: {}, error: 'updates must be an object.' };
  const patch: Record<string, string> = {};
  for (const [key, raw] of Object.entries(updates as Record<string, unknown>)) {
    if (!EDITABLE.includes(key as EditableField)) return { patch: {}, error: `Field "${key}" cannot be edited.` };
    if (typeof raw !== 'string') return { patch: {}, error: `Field "${key}" must be text.` };
    const value = raw.trim();
    const field = key as EditableField;
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

