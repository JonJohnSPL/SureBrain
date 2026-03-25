import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/SureBrain/', // GitHub Pages: https://JonJohn23.github.io/SureBrain/
})
