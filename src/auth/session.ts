import { useSyncExternalStore } from 'react'
import { configureAuth } from '../lib/api-client.ts'

/** The logged-in user's access token, persisted in localStorage so it survives reloads. */
export type Session = { accessToken: string; expiresAt: number }

const STORAGE_KEY = 'book-tracker.session'

const listeners = new Set<() => void>()
let current: Session | null = null
let expiryTimer: ReturnType<typeof setTimeout> | undefined

function read(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'accessToken' in parsed &&
      'expiresAt' in parsed &&
      typeof parsed.accessToken === 'string' &&
      typeof parsed.expiresAt === 'number' &&
      parsed.expiresAt > Date.now()
    ) {
      return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt }
    }
  } catch {
    // Unreadable storage or corrupt JSON: treat as logged out.
  }
  return null
}

function apply(session: Session | null) {
  current = session
  clearTimeout(expiryTimer)
  // Log out when the token expires, so the UI does not wait for the next 401.
  // Capped because setTimeout fires at once for delays above 2^31 - 1 ms.
  if (session) {
    expiryTimer = setTimeout(endSession, Math.min(session.expiresAt - Date.now(), 2 ** 31 - 1))
  }
  listeners.forEach((listener) => listener())
}

export function startSession(accessToken: string, expiresInSeconds: number) {
  const session = { accessToken, expiresAt: Date.now() + expiresInSeconds * 1000 }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage unavailable (e.g. private mode): the session still lasts until reload.
  }
  apply(session)
}

export function endSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clean up.
  }
  apply(null)
}

export function getSession(): Session | null {
  return current
}

export function subscribeToSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribeToSession, getSession)
}

/**
 * Loads the stored session, lets the API client send its token (and end it on a 401),
 * and keeps it in sync with other tabs. Call once at startup.
 */
export function initSession() {
  configureAuth({ getToken: () => current?.accessToken ?? null, onUnauthorized: endSession })
  apply(read())
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) apply(read())
  })
}
