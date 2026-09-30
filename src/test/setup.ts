import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { endSession, initSession } from '../auth/session.ts'
import { server } from './server.ts'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  initSession()
})
afterEach(() => {
  server.resetHandlers()
  cleanup()
  endSession()
  localStorage.clear()
})
afterAll(() => server.close())
