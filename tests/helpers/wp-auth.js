/**
 * WP Admin helpers shared across specs.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Path where the saved WP Admin session cookies are stored. */
export const AUTH_FILE = path.join(__dirname, '..', '.auth.json');

/** Path where we cache the secret token between setup and specs. */
export const STATE_FILE = path.join(__dirname, '..', '.test-state.json');

/**
 * Log into WP Admin and return the page (already on /wp-admin/index.php).
 * Assumes the page is open and not yet logged in.
 */
export async function wpLogin(page) {
  await page.goto('/wp-admin/');
  await page.fill('#user_login', 'admin');
  await page.fill('#user_pass',  'admin');
  await page.click('#wp-submit');
  // Wait until the admin dashboard is present
  await page.waitForSelector('#wpadminbar', { timeout: 20_000 });
}

/**
 * Navigate to the Kindness Hearts admin page and return the page.
 */
export async function gotoKindnessAdmin(page) {
  await page.goto('/wp-admin/admin.php?page=kindness-hearts');
  // Wait for the plugin's class table to load
  await page.waitForSelector('#kh-classes-body', { timeout: 15_000 });
}

/**
 * Read the secret token injected by WP into window.KH.secretToken.
 * Must be called while the Kindness Hearts admin page is open.
 */
export async function extractToken(page) {
  await gotoKindnessAdmin(page);
  return page.evaluate(() => window.KH?.secretToken ?? '');
}
