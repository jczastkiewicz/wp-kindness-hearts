/**
 * 03 – Heart display (projector page)
 *
 * Tests the public /kindness-app/#/heart page:
 *  - Page loads without authentication
 *  - Title and description are present
 *  - School-wide badge is shown
 *  - Canvas (dot visualisation) is rendered
 *  - Leaderboard rows match the number of classes in the API
 *  - Total updates after a point is awarded via the REST API
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import { STATE_FILE } from '../helpers/wp-auth.js';

const BASE = 'http://localhost:8082';
const API  = `${BASE}/wp-json/kindness/v1`;

function readToken() {
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).token;
}

test.describe('Heart display', () => {

  // ── Page loads without a token ──────────────────────────────────────────────
  test('loads the heart page without authentication', async ({ page }) => {
    await page.goto(`${BASE}/kindness-app/#/heart`);
    await expect(page.getByText('Our Kindness Heart')).toBeVisible({ timeout: 20_000 });
  });

  // ── Subtitle ────────────────────────────────────────────────────────────────
  test('shows the "every dot is a moment of kindness" subtitle', async ({ page }) => {
    await page.goto(`${BASE}/kindness-app/#/heart`);
    await expect(
      page.getByText('Every dot represents one moment of kindness')
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── School-wide badge ───────────────────────────────────────────────────────
  test('shows the school-wide points badge', async ({ page }) => {
    await page.goto(`${BASE}/kindness-app/#/heart`);
    await expect(page.getByText(/school-wide!/)).toBeVisible({ timeout: 15_000 });
  });

  // ── Heart SVG renders ──────────────────────────────────────────────────────
  test('renders the heart visualisation SVG', async ({ page }) => {
    await page.goto(`${BASE}/kindness-app/#/heart`);
    // HeartVisualization renders an <svg> with an aria-label describing the dots
    await expect(
      page.locator('svg[aria-label*="Heart made of dots"]')
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── Leaderboard ─────────────────────────────────────────────────────────────
  test('shows a leaderboard row for each class', async ({ page, request }) => {
    // Fetch class count directly from the REST API
    const res     = await request.get(`${API}/classes`);
    const classes = await res.json();

    await page.goto(`${BASE}/kindness-app/#/heart`);
    await page.waitForSelector('svg[aria-label*="Heart made of dots"]', { timeout: 15_000 });

    if (classes.length > 0) {
      // Wait for the leaderboard heading to appear
      await expect(page.getByRole('heading', { name: 'Classes' })).toBeVisible();

      // Each class should have a row with its name visible
      for (const cls of classes) {
        await expect(page.getByText(cls.name)).toBeVisible();
      }
    }
  });

  // ── Live update ──────────────────────────────────────────────────────────────
  test('updates the total after a new point is awarded', async ({ page, request }) => {
    const token = readToken();

    // Get current total
    const before = (await (await request.get(`${API}/total`)).json()).total;

    // Award a point via REST API directly
    const classesRes = await request.get(`${API}/classes`);
    const classes    = await classesRes.json();
    expect(classes.length).toBeGreaterThan(0);

    await request.post(`${API}/points`, {
      params: { token },
      data:   { class_id: classes[0].id },
    });

    // Load the heart page and wait for it to show the updated count
    await page.goto(`${BASE}/kindness-app/#/heart`);
    const expectedBadge = new RegExp(`${before + 1}.*school-wide`);
    await expect(page.getByText(expectedBadge)).toBeVisible({ timeout: 15_000 });
  });
});
