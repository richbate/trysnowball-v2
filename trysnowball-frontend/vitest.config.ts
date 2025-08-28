import { defineConfig } from 'vitest/config';
import workers from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  test: {
    pool: workers({
      wrangler: { configPath: './wrangler.test.toml' }
    }),                           // run tests in a Workers-like env
    environment: 'miniflare',     // or 'workerd' if you prefer
    include: ['src/**/*.test.ts'],
    globals: true,
  },
});