import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*'],
      exclude: ['src/__tests__/**', 'src/index.ts', 'src/env.d.ts'],
    },
  },
});

