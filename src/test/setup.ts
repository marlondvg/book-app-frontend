import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { endSession, initSession } from '../auth/session.ts'
import { initTheme, setTheme } from '../theme/theme.ts'
import { server } from './server.ts'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  initSession()
  initTheme()
})
afterEach(() => {
  server.resetHandlers()
  cleanup()
  endSession()
  setTheme('light')
  localStorage.clear()
})
afterAll(() => server.close())
