import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

// index.html reads this key before the app loads, to avoid a flash of the light theme.
const STORAGE_KEY = 'book-tracker.theme'

const listeners = new Set<() => void>()
let current: Theme = 'light'

function read(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Light is the default: the theme only changes when the user picks dark. */
function apply(theme: Theme) {
  current = theme
  document.documentElement.dataset.theme = theme
  listeners.forEach((listener) => listener())
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage unavailable: the choice lasts until reload.
  }
  apply(theme)
}

export function getTheme(): Theme {
  return current
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme)
}

/** Applies the saved theme (light when none) and keeps tabs in sync. Call once at startup. */
export function initTheme() {
  apply(read())
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) apply(read())
  })
}
