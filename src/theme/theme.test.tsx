import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/render.tsx'
import { getTheme, initTheme } from './theme.ts'

const STORAGE_KEY = 'book-tracker.theme'
const themeAttribute = () => document.documentElement.dataset.theme

describe('theme', () => {
  it('starts light', () => {
    initTheme()

    expect(getTheme()).toBe('light')
    expect(themeAttribute()).toBe('light')
  })

  it('switches between light and dark from the header and remembers the choice', async () => {
    renderRoute('/login')
    const u = userEvent.setup()

    await u.click(screen.getByRole('button', { name: 'Switch to dark theme' }))

    expect(themeAttribute()).toBe('dark')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')

    await u.click(screen.getByRole('button', { name: 'Switch to light theme' }))

    expect(themeAttribute()).toBe('light')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('restores a saved dark theme at startup', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    initTheme()

    expect(themeAttribute()).toBe('dark')
  })

  it('falls back to light for an unknown saved value', () => {
    localStorage.setItem(STORAGE_KEY, 'sepia')

    initTheme()

    expect(themeAttribute()).toBe('light')
  })
})
