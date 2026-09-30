import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from './test/render.tsx'

describe('routes', () => {
  it('shows the home page at /', () => {
    renderRoute('/')
    expect(screen.getByRole('heading', { name: 'Your books' })).toBeInTheDocument()
  })

  it('shows the not found page for unknown paths', () => {
    renderRoute('/nope')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to your books' })).toHaveAttribute('href', '/')
  })
})
