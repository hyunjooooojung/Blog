const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;

export function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s);
}
