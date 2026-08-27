import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const testDatabasePath = fileURLToPath(
  new URL('./data/csgofriberg.test.sqlite3', import.meta.url)
);

export default defineConfig({
  test: {
    env: {
      DB_CLIENT: 'sqlite',
      DB_URL: testDatabasePath,
      REDIS_REQUIRED: 'false',
    },
    globalSetup: ['./test/globalSetup.ts'],
  },
});
