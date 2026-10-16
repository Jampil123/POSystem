/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // A new version waits until the user taps "Reload" (see UpdatePrompt).
      registerType: 'prompt',
      // Uses the existing public/manifest.webmanifest instead of generating one
      manifest: false,
      includeAssets: ['icons/*.png', 'brand/*.png'],
      workbox: {
        // The app shell is saved on the device, so it opens without internet
        // and shows the "No internet connection" screen instead of a browser error.
        // Data from Supabase is never cached.
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // Code shared with the Supabase Edge Functions (plain TypeScript, no Deno APIs).
      '@functions': path.resolve(import.meta.dirname, './supabase/functions'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
})
