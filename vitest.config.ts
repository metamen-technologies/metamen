import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/core', replacement: resolve(__dirname, './src/lib/core') },
      { find: '@/types', replacement: resolve(__dirname, './src/types') },
      { find: '@/components', replacement: resolve(__dirname, './src/components') },
      { find: '@/hooks', replacement: resolve(__dirname, './src/hooks') },
      { find: '@/actions', replacement: resolve(__dirname, './src/lib/server/actions') },
      { find: '@/stores', replacement: resolve(__dirname, './src/stores') },
      { find: '@', replacement: resolve(__dirname, './src') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e/', 'tests/integration/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/not-found.tsx',
        'src/app/**/error.tsx',
        'src/app/**/page.tsx',
        'src/middleware.ts',
        'src/types/',
        'src/components/index.ts',
        'src/hooks/index.ts',
        'src/stores/index.ts',
        'src/lib/server/actions/index.ts',
      ],
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 2,
      },
    },
    retry: 0,
    testTimeout: 10000,
    hookTimeout: 10000,
    reporters: ['default'],
    passWithNoTests: true,
  },
});
