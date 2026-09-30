import { afterEach, describe, expect, it, vi } from 'vitest'
import { endSession, getSession, initSession, startSession } from './session.ts'

const STORAGE_KEY = 'book-tracker.session'

describe('session', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists a started session and loads it again at startup', () => {
    startSession('abc', 3600)
    const stored = getSession()

    initSession()

    expect(stored?.accessToken).toBe('abc')
    expect(getSession()).toEqual(stored)
  })

  it('ignores an expired stored session', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: 'old', expiresAt: 1 }))

    initSession()

    expect(getSession()).toBeNull()
  })

  it('ignores a corrupt stored session', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')

    initSession()

    expect(getSession()).toBeNull()
  })

  it('ends the session when the token expires', () => {
    vi.useFakeTimers()
    startSession('abc', 60)

    vi.advanceTimersByTime(59_000)
    expect(getSession()).not.toBeNull()

    vi.advanceTimersByTime(1_000)
    expect(getSession()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('removes the stored session on logout', () => {
    startSession('abc', 3600)

    endSession()

    expect(getSession()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
