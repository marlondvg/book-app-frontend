import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      // Fixed so MSW handlers never depend on a developer's .env files.
      VITE_API_URL: 'http://api.test',
      // West of UTC, so code that reads a YYYY-MM-DD date as UTC midnight shows the
      // previous day and fails the tests. Also the zone userTimeZone() reports.
      TZ: 'America/Bogota',
    },
  },
})
