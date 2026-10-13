/**
 * Normalizes a user handle ensuring exactly one leading '@' symbol,
 * stripping any duplicate '@' characters, extra symbols, or whitespace.
 *
 * @param handle - Raw handle string (e.g. '@law', '@@law', 'law')
 * @returns Canonical handle with single leading '@', or empty string if input is empty
 */
export function formatHandle(handle?: string | null): string {
  if (!handle) return '';
  const trimmed = handle.trim();
  if (!trimmed) return '';
  const stripped = trimmed.replace(/^@+/, '');
  return stripped ? `@${stripped}` : '';
}

/**
 * Strips any leading '@' symbols from a handle (useful for input form states and validation).
 *
 * @param handle - Raw handle string
 * @returns Clean alphanumeric handle without leading '@'
 */
export function stripHandle(handle?: string | null): string {
  if (!handle) return '';
  return handle.trim().replace(/^@+/, '');
}
