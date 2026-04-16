/**
 * Playwright global setup — runs once before all test specs.
 *
 * Steps:
 *  1. Log in to WP Admin
 *  2. Upload and activate wp-kindness-hearts.zip (skip if already active)
 *  3. Extract the secret token from window.KH
 *  4. Save auth cookies  → .auth.json        (reused by all specs)
 *  5. Save secret token  → .test-state.json  (reused by all specs)
 */

import { chromium } from '@playwright/test';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { wpLogin, extractToken, AUTH_FILE, STATE_FILE } from './helpers/wp-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The zip is one level up from the tests/ directory
const ZIP_PATH = path.resolve(__dirname, '..', 'wp-kindness-hearts.zip');

export default async function globalSetup() {
  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(
      `Plugin zip not found at: ${ZIP_PATH}\n` +
      `Run ./build-plugin.sh (or ./start-test.sh) first.`
    );
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: 'http://localhost:8082' });
  const page    = await context.newPage();

  // ── 1. Log in ──────────────────────────────────────────────────────────────
  console.log('[setup] Logging in to WP Admin…');
  await wpLogin(page);

  // ── 2. Reinstall plugin fresh on every run ─────────────────────────────────
  // Always delete + re-upload so the zip built from current source is what runs.
  await page.goto('/wp-admin/plugins.php');

  const pluginRow = page.locator('tr[data-plugin="wp-kindness-hearts/wp-kindness-hearts.php"]');

  if (await pluginRow.count() > 0) {
    console.log('[setup] Plugin already installed — deactivating and deleting for fresh install…');

    // Deactivate first (required before delete)
    const deactivateLink = pluginRow.locator('a:has-text("Deactivate")');
    if (await deactivateLink.count() > 0) {
      await deactivateLink.click();
      await page.waitForURL('**/plugins.php**', { timeout: 10_000 });
    }

    // Delete
    const deleteLink = page.locator('tr[data-plugin="wp-kindness-hearts/wp-kindness-hearts.php"] a:has-text("Delete")');
    if (await deleteLink.count() > 0) {
      page.once('dialog', d => d.accept());
      await deleteLink.click();
      await page.waitForURL('**/plugins.php**', { timeout: 10_000 });
    }
    console.log('[setup] Old plugin removed.');
  }

  console.log('[setup] Uploading plugin zip…');

  // Navigate to the upload tab
  await page.goto('/wp-admin/plugin-install.php');
  await page.click('a.upload-view-toggle');

  // Set the zip file on the hidden file input
  const fileInput = page.locator('#pluginzip');
  await fileInput.setInputFiles(ZIP_PATH);

  // Click "Install Now"
  await page.click('#install-plugin-submit');

  // Wait for the result page
  await page.waitForSelector('.wrap h1, #message', { timeout: 30_000 });

  // Check for errors before continuing
  const errorBox = page.locator('.notice-error, .error');
  if (await errorBox.count() > 0) {
    const errorText = await errorBox.first().innerText();
    throw new Error(`Plugin install failed: ${errorText}`);
  }

  // Click "Activate Plugin"
  console.log('[setup] Activating plugin…');
  await page.click('a:has-text("Activate Plugin")');

  // Wait for plugins list to confirm activation
  await page.waitForURL('**/plugins.php**', { timeout: 15_000 });
  console.log('[setup] Plugin activated.');

  // ── 3. Extract the secret token ────────────────────────────────────────────
  console.log('[setup] Extracting secret token from admin page…');
  const token = await extractToken(page);

  if (!token) {
    throw new Error(
      'Could not read window.KH.secretToken from the admin page. ' +
      'Check that the plugin activated successfully.'
    );
  }
  console.log(`[setup] Token obtained (${token.length} chars).`);

  // ── 4. Seed permanent classes for teacher / heart / security specs ──────────
  // The configure spec adds and deletes its own class; seed two classes here
  // so the teacher app always has options to show and test 10 (switch class) runs.
  const seedClasses = ['Seed Class 1A', 'Seed Class 2B'];
  const existingRows = await page.locator('#kh-classes-body td:first-child').allInnerTexts();

  for (const seedName of seedClasses) {
    if (!existingRows.includes(seedName)) {
      console.log(`[setup] Seeding class "${seedName}"…`);
      await page.fill('#kh-class-name', seedName);
      await page.click('#kh-add-class-form button[type="submit"]');
      await page.waitForSelector(`#kh-classes-body td:text("${seedName}")`, { timeout: 10_000 });
    } else {
      console.log(`[setup] Class "${seedName}" already exists — skipping.`);
    }
  }
  console.log('[setup] Classes ready.');

  // ── 5. Save auth cookies for all specs ─────────────────────────────────────
  await context.storageState({ path: AUTH_FILE });
  console.log(`[setup] Auth saved → ${AUTH_FILE}`);

  // ── 6. Save token for all specs ────────────────────────────────────────────
  fs.writeFileSync(STATE_FILE, JSON.stringify({ token }, null, 2));
  console.log(`[setup] State saved → ${STATE_FILE}`);

  await browser.close();
}
