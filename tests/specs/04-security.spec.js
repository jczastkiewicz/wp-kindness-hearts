/**
 * 04 – Security & edge cases
 *
 * Tests token enforcement and admin-only operations:
 *  - POST /points with no token        → 401
 *  - POST /points with wrong token     → 403
 *  - POST /points with valid token     → 200
 *  - Regenerate token invalidates the old one
 *  - Reset all points zeroes counters
 */

import { test, expect } from '@playwright/test';
import fs   from 'fs';
import { AUTH_FILE, STATE_FILE, gotoKindnessAdmin } from '../helpers/wp-auth.js';

const BASE = 'http://localhost:8082';
const API  = `${BASE}/wp-json/kindness/v1`;

function readToken() {
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).token;
}

// ── REST API token enforcement ──────────────────────────────────────────────
test.describe('Token enforcement (REST API)', () => {

  test('POST /points with no token returns 401', async ({ request }) => {
    const classesRes = await request.get(`${API}/classes`);
    const classes    = await classesRes.json();

    const res = await request.post(`${API}/points`, {
      data: { class_id: classes[0]?.id ?? 1 },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /points with wrong token returns 403', async ({ request }) => {
    const classesRes = await request.get(`${API}/classes`);
    const classes    = await classesRes.json();

    const res = await request.post(`${API}/points`, {
      params: { token: 'definitely-not-the-right-token' },
      data:   { class_id: classes[0]?.id ?? 1 },
    });
    expect(res.status()).toBe(403);
  });

  test('POST /points with valid token returns 200', async ({ request }) => {
    const token      = readToken();
    const classesRes = await request.get(`${API}/classes`);
    const classes    = await classesRes.json();
    expect(classes.length).toBeGreaterThan(0);

    const res = await request.post(`${API}/points`, {
      params: { token },
      data:   { class_id: classes[0].id },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('class_points');
    expect(body).toHaveProperty('total_points');
  });

  test('POST /points with valid token as header returns 200', async ({ request }) => {
    const token      = readToken();
    const classesRes = await request.get(`${API}/classes`);
    const classes    = await classesRes.json();

    const res = await request.post(`${API}/points`, {
      headers: { 'X-KH-Token': token },
      data:    { class_id: classes[0].id },
    });
    expect(res.status()).toBe(200);
  });
});

// ── Token regeneration ──────────────────────────────────────────────────────
test.describe('Token regeneration', () => {
  // Use the logged-in admin session for admin-only operations
  test.use({ storageState: AUTH_FILE });

  test('old token is rejected after regenerating a new one', async ({ page, request }) => {
    const oldToken = readToken();

    // Regenerate via admin UI
    await gotoKindnessAdmin(page);
    page.once('dialog', d => d.accept()); // "This will invalidate the old QR code…"

    // The regen handler calls location.reload() — capture the navigation before clicking
    const navigationPromise = page.waitForNavigation({ timeout: 15_000 });
    await page.click('#kh-regen-token-btn');
    await navigationPromise;

    // Wait for WordPress to re-inject window.KH into the reloaded page
    await page.waitForFunction(
      () => typeof window.KH?.secretToken === 'string' && window.KH.secretToken.length > 0,
      { timeout: 10_000 }
    );

    // Old token should now be rejected
    const classesRes = await request.get(`${API}/classes`);
    const classes    = await classesRes.json();

    const res = await request.post(`${API}/points`, {
      params: { token: oldToken },
      data:   { class_id: classes[0]?.id ?? 1 },
    });
    expect(res.status()).toBe(403);

    // New token is available in window.KH and should work
    const newToken = await page.evaluate(() => window.KH.secretToken);
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(oldToken);

    const res2 = await request.post(`${API}/points`, {
      params: { token: newToken },
      data:   { class_id: classes[0].id },
    });
    expect(res2.status()).toBe(200);

    // Persist the new token so subsequent specs still work
    fs.writeFileSync(STATE_FILE, JSON.stringify({ token: newToken }, null, 2));
  });
});

// ── Reset all points ────────────────────────────────────────────────────────
test.describe('Reset all points', () => {
  test.use({ storageState: AUTH_FILE });

  test('resets school total and all class counters to zero', async ({ page, request }) => {
    // Ensure there is at least one point to reset
    const token      = readToken();
    const classesRes = await request.get(`${API}/classes`);
    const classes    = await classesRes.json();
    expect(classes.length).toBeGreaterThan(0);

    await request.post(`${API}/points`, {
      params: { token },
      data:   { class_id: classes[0].id },
    });

    // Reset via admin UI
    await gotoKindnessAdmin(page);
    page.once('dialog', d => d.accept()); // confirm prompt
    await page.click('#kh-reset-btn');

    // Total counter on the admin page should show 0
    await expect(async () => {
      const text = await page.locator('#kh-total-display').textContent();
      expect(parseInt(text ?? '1', 10)).toBe(0);
    }).toPass({ timeout: 10_000 });

    // REST API /total confirms 0
    const totalRes = await request.get(`${API}/total`);
    const total    = await totalRes.json();
    expect(total.total).toBe(0);

    // Every class has 0 points
    const updatedRes = await request.get(`${API}/classes`);
    const updated    = await updatedRes.json();
    for (const cls of updated) {
      expect(cls.points).toBe(0);
    }
  });
});
