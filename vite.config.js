import { defineConfig } from 'vite'

// PORT is assigned by the preview harness when present.
export default defineConfig({
  base: process.env.GH_PAGES ? '/ember-gallery/' : '/',
  server: {
    port: Number(process.env.PORT) || 5174,
  },
})
