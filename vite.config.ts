/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // mock API 가 localStorage 를 쓰므로 DOM 환경이 필요하다.
    environment: 'jsdom',
  },
})
