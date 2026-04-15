/** Shared formatting for public event UIs. */

export function formatEventDate(value: string | undefined): string {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Same rules as admin list: all lines start with - / • / * → real list */
export function bulletListFrom(text: string | undefined): string[] | null {
  if (!text?.trim()) return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  if (!lines.every((l) => /^[-•*]/.test(l))) return null;
  return lines.map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter((l) => l.length > 0);
}
