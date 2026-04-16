// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',

  // Run each spec file sequentially (install must finish before feature tests)
  fullyParallel: false,

  // No retries — integration tests should be deterministic
  retries: 0,

  // One worker: tests share the same WP instance
  workers: 1,

  // Increase timeout for slow WP operations (plugin install, page load)
  timeout: 60_000,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:8082',

    // Save screenshots and video on test failure for debugging
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',

    // Give WP / React time to settle
    actionTimeout:     15_000,
    navigationTimeout: 30_000,
  },

  // global-setup runs once before all tests:
  //   - installs & activates the plugin
  //   - extracts the secret token
  //   - saves auth cookies for all specs
  globalSetup: './global-setup.js',
});
