import { defineConfig } from 'vitest/config';

/**
 * Test runner config. Integration/API tests connect to a real MongoDB test
 * database (local in dev, a `mongo` service in CI), so files run sequentially
 * to avoid cross-test interference on shared collections.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/nextlearn_test',
      JWT_ACCESS_SECRET: 'test_access_secret_at_least_32_chars_long_xxxx',
      JWT_REFRESH_SECRET: 'test_refresh_secret_at_least_32_chars_long_xx',
      CLIENT_URL: 'http://localhost:3000',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    },
  },
});
