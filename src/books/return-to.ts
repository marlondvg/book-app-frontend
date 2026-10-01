import { useLocation } from 'react-router-dom'

/** Router state that tells the book form which page to go back to. */
export type ReturnToState = { returnTo: string }

/** Where to go after saving or cancelling: the page that opened the form, or the book list. */
export function useReturnTo(): string {
  const state = useLocation().state as Partial<ReturnToState> | null
  const returnTo = state?.returnTo
  // Only same-app paths; state can come from anywhere that calls navigate().
  return typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
    ? returnTo
    : '/'
}
