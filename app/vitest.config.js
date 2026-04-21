import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // enforce 85% minimums project-wide
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
      all: true,
    },
  },
});
