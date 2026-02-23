import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Dailo/', // for GitHub Pages: https://sdroan.github.io/Dailo/
})
