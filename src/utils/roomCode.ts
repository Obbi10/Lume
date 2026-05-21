// Encodes room metadata into a shareable URL-safe base64 string.
// This lets anyone with the code reconstruct the room locally — no backend needed.
export function generateShareCode(name: string, subject: string, maxCapacity: number, code: string): string {
  const payload = JSON.stringify({ n: name, s: subject, c: maxCapacity, k: code });
  return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeShareCode(input: string): { name: string; subject: string; maxCapacity: number; code: string } | null {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const d = JSON.parse(json);
    if (typeof d.n === 'string' && typeof d.s === 'string' && typeof d.c === 'number' && typeof d.k === 'string') {
      return { name: d.n, subject: d.s, maxCapacity: d.c, code: d.k };
    }
    return null;
  } catch { return null; }
}
