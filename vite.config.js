import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works at any GitHub Pages path (username.github.io/<repo>/).
export default defineConfig({
  base: './',
  plugins: [react()],
})
