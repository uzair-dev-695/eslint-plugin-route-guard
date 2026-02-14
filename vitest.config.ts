import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85
      },
      exclude: [
        'dist/**',
        'tests/**',
        '**/*.test.ts',
        '**/__tests__/**',
        'rollup.config.mjs',
        'vitest.config.ts',
        'src/rules/*.ts'
      ]
    }
  }
});
