import { fileURLToPath } from 'node:url'
// vitest/config's defineConfig is Vite's, plus the `test` block.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()
    , tailwindcss()
  ],
  resolve: {
    // Keep in sync with "paths" in tsconfig.json
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    // Fail instead of moving to another port: the API only allows this
    // origin through CORS (CORS_ORIGIN in apps/api/.env).
    strictPort: true,
    open: true,
  },
  test: {
    // Component tests render into jsdom; MSW answers their API calls.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
