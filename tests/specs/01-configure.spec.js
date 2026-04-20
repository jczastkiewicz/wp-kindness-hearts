/**
 * 01 – Admin configuration
 *
 * Tests the WP Admin Kindness Hearts page:
 *  - Add a class
 *  - Class appears in the table with 0 points
 *  - Stats counter updates
 *  - QR code canvas renders
 *  - Delete a class
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILE, gotoKindnessAdmin } from '../helpers/wp-auth.js';

// Reuse the logged-in session saved by global-setup
test.use({ storageState: AUTH_FILE });

const TEST_CLASS = 'Playwright Class 1A';

test.describe('Admin – configure classes', () => {

  test.beforeEach(async ({ page }) => {
    await gotoKindnessAdmin(page);
  });

  // ── Add a class ─────────────────────────────────────────────────────────────
  test('adds a new class and shows it in the table', async ({ page }) => {
    await page.fill('#kh-class-name', TEST_CLASS);
    await page.click('#kh-add-class-form button[type="submit"]');

    // Row appears in the table
    await expect(
      page.locator('#kh-classes-body td', { hasText: TEST_CLASS })
    ).toBeVisible({ timeout: 10_000 });

    // Points start at 0
    const row = page.locator('#kh-classes-body tr', { hasText: TEST_CLASS });
    await expect(row.locator('td:nth-child(2)')).toHaveText('0');
  });

  // ── Stats bar ───────────────────────────────────────────────────────────────
  test('stats bar shows correct class count', async ({ page }) => {
    // At least one class must exist (created in previous test or from setup)
    const countText = await page.locator('#kh-classes-count').textContent();
    const count = parseInt(countText ?? '0', 10);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ── QR code ─────────────────────────────────────────────────────────────────
  test('QR code canvas renders inside #kh-qrcode', async ({ page }) => {
    // qr-code-styling appends a <canvas> element
    await expect(page.locator('#kh-qrcode canvas')).toBeVisible({ timeout: 10_000 });
  });

  // ── App URL link ─────────────────────────────────────────────────────────────
  test('teacher URL link is present (token is not embedded in HTML)', async ({ page }) => {
    const href = await page.locator('a[href*="#/teacher"]').getAttribute('href');
    expect(href).toContain('#/teacher');
    // Token should not be embedded in the admin page HTML
    expect(href).not.toMatch(/token=/);
  });

  // ── Delete the test class ───────────────────────────────────────────────────
  test('deletes the test class', async ({ page }) => {
    const row = page.locator('#kh-classes-body tr', { hasText: TEST_CLASS });

    // Only run if the test class exists (may not if a previous test failed)
    if (await row.count() === 0) {
      test.skip();
    }

    page.once('dialog', dialog => dialog.accept());
    await row.locator('.kh-del-btn').click();

    await expect(
      page.locator('#kh-classes-body td', { hasText: TEST_CLASS })
    ).toHaveCount(0, { timeout: 10_000 });
  });
});
