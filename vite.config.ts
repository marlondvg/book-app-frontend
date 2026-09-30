import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Fixed so MSW handlers never depend on a developer's .env files.
    env: { VITE_API_URL: 'http://api.test' },
  },
})
