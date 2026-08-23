import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: 10_000_000,
    rollupOptions: {
      input: 'app.html',
    },
  },
})
