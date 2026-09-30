import { setupServer } from 'msw/node'

export const API_URL = 'http://api.test'

/** Shared MSW server. Tests add handlers with `server.use(...)`; they are reset after each test. */
export const server = setupServer()
