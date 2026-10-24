import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const page = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // In dev the admin panel talks to `npm run server` through this proxy (same origin, so the cookie just works).
  // Host must stay as the browser sent it: the API rejects POSTs whose Origin doesn't match it (CSRF check).
  // allowedHosts: Telegram reaches the dev server only through an HTTPS tunnel (ngrok or cloudflared) when testing the Mini App.
  server: { allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.trycloudflare.com'], proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } } },
  // Separate apps: the public site, the admin panel (/admin/) and the bot's Mini App (/tg/), so none ships the others' code.
  build: { rollupOptions: { input: { main: page('./index.html'), admin: page('./admin/index.html'), tg: page('./tg/index.html') } } },
})
