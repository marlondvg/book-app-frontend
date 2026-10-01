/**
 * The browser's IANA time zone (e.g. "America/Bogota"), or undefined if it reports none.
 * Read on every call, not cached, so a user who travels gets their current zone.
 */
export function userTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}
