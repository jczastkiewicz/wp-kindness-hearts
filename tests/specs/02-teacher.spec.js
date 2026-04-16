/**
 * 02 – Teacher PWA
 *
 * Tests the teacher-facing React app:
 *  - Page loads with a valid token
 *  - Class selector is populated
 *  - Tapping the heart button awards a point
 *  - Counter increments after award
 *  - No-token URL shows the "Access required" gate
 */

import { test, expect } from '@playwright/test';
import fs   from 'fs';
import { STATE_FILE } from '../helpers/wp-auth.js';

// Read the token written by global-setup
function readToken() {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  return state.token;
}

const BASE = 'http://localhost:8082';

test.describe('Teacher app', () => {

  // ── No token → access gate ──────────────────────────────────────────────────
  test('shows access-required screen when token is missing', async ({ page }) => {
    await page.goto(`${BASE}/kindness-app/#/teacher`);
    await expect(page.getByText('Access required')).toBeVisible({ timeout: 15_000 });
  });

  // ── Valid token → app loads ─────────────────────────────────────────────────
  test('loads the teacher app with a valid token', async ({ page }) => {
    const token = readToken();
    await page.goto(`${BASE}/kindness-app/#/teacher?token=${token}`);

    // Header is visible
    await expect(page.getByText('Kindness Points')).toBeVisible({ timeout: 20_000 });

    // Class selector is rendered with at least one option
    const select = page.locator('select.kh-select');
    await expect(select).toBeVisible();
    const optionCount = await select.locator('option').count();
    expect(optionCount).toBeGreaterThanOrEqual(1);
  });

  // ── Award a point ───────────────────────────────────────────────────────────
  test('awards a point when the heart button is tapped', async ({ page }) => {
    const token = readToken();
    await page.goto(`${BASE}/kindness-app/#/teacher?token=${token}`);
    await page.waitForSelector('select.kh-select', { timeout: 20_000 });

    // Read the points counter before
    const pointsEl = page.locator('[style*="2.8rem"]').first();
    await expect(pointsEl).toBeVisible();
    const before = parseInt(await pointsEl.textContent() ?? '0', 10);

    // Tap the heart
    await page.click('button.heart-btn');

    // Counter should increment
    await expect(async () => {
      const after = parseInt(await pointsEl.textContent() ?? '0', 10);
      expect(after).toBe(before + 1);
    }).toPass({ timeout: 10_000 });
  });

  // ── School-wide total appears after award ───────────────────────────────────
  test('shows the school-wide total after awarding a point', async ({ page }) => {
    const token = readToken();
    await page.goto(`${BASE}/kindness-app/#/teacher?token=${token}`);
    await page.waitForSelector('select.kh-select', { timeout: 20_000 });

    await page.click('button.heart-btn');

    // The school-wide line appears below the counter
    await expect(page.getByText(/school-wide/)).toBeVisible({ timeout: 10_000 });
  });

  // ── Switching classes ───────────────────────────────────────────────────────
  test('updates the points display when a different class is selected', async ({ page }) => {
    const token = readToken();
    await page.goto(`${BASE}/kindness-app/#/teacher?token=${token}`);

    const select = page.locator('select.kh-select');
    await select.waitFor({ timeout: 20_000 });

    const options = await select.locator('option').allInnerTexts();
    if (options.length < 2) {
      test.skip(); // Need at least 2 classes for this test
    }

    // Select the second class
    await select.selectOption({ index: 1 });

    // Header label updates to show the new class name
    await expect(page.getByText(`points in ${options[1]}`)).toBeVisible({ timeout: 5_000 });
  });
});
