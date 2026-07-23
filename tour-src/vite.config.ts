/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base './' keeps the built dist/ relocatable: it works from any host root,
// subfolder, or iframe without rebuilding.
//
// SINGLE_FILE=1 inlines all JS/CSS/fonts into one self-contained index.html
// (used for the shareable Artifact preview link). The app makes zero external
// requests, so the single file runs anywhere, including a strict-CSP iframe.
const singleFile = process.env.SINGLE_FILE === '1'

export default defineConfig({
  base: './',
  plugins: [react(), ...(singleFile ? [viteSingleFile()] : [])],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    ...(singleFile ? { assetsInlineLimit: 100_000_000 } : {}),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
