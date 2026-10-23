import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const page = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // In dev the admin panel talks to `npm run server` through this proxy (same origin, so the cookie just works).
  // Host must stay as the browser sent it: the API rejects POSTs whose Origin doesn't match it (CSRF check).
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } } },
  // Two separate apps: the public site and the admin panel (/admin/), so admin code never ships to visitors.
  build: { rollupOptions: { input: { main: page('./index.html'), admin: page('./admin/index.html') } } },
})
