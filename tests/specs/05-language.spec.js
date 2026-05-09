/**
 * 05 – Language switcher (PL / EN)
 *
 * Tests the in-app language switcher rendered on both the teacher and heart
 * pages. Each test seeds localStorage's `kh-lang` key before navigating so
 * the starting language is deterministic regardless of the WordPress site
 * locale or browser language. The seeded value has the highest precedence
 * in detectInitialLanguage() — see app/src/i18n/index.js.
 *
 * Verifies:
 *
 *   - Polish renders correctly when seeded and is the visible default.
 *   - Clicking EN switches the UI to English (heading + key labels).
 *   - The choice is persisted in localStorage and survives a page reload.
 *   - <html lang> attribute updates to match the active language.
 *   - The switcher works on the heart page (no-token public view) and
 *     on the access-required gate.
 *   - aria-pressed reflects the active button.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import { STATE_FILE } from '../helpers/wp-auth.js';

const BASE = 'http://localhost:8082';

function readToken() {
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).token;
}

/**
 * Force the app to boot in Polish by pre-seeding localStorage. This is
 * stable regardless of the WordPress site language: detectInitialLanguage()
 * checks localStorage first.
 *
 * We seed via addInitScript so the value is present before the React app
 * imports its i18n module on the first navigation.
 */
async function seedLang(page, lang) {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem('kh-lang', value);
    } catch {
      // ignore — sandboxed contexts may block localStorage; the test will
      // simply fall back to whatever WP_CONFIG/browser detection picks
    }
  }, lang);
}

test.describe('Language switcher — Teacher page', () => {

  test('renders in Polish and switches to English on click', async ({ page }) => {
    await seedLang(page, 'pl');
    const token = readToken();
    await page.goto(`${BASE}/kindness-app/#/teacher?token=${token}`);

    // Polish heading visible by default
    await expect(page.getByRole('heading', { name: 'Punkty życzliwości' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('Wybierz klasę')).toBeVisible();

    // Switcher group is present and PL is the active button
    const switcher = page.getByRole('group', { name: /Język|Language/ });
    await expect(switcher).toBeVisible();
    const plBtn = switcher.getByRole('button', { name: 'Polski' });
    const enBtn = switcher.getByRole('button', { name: 'Angielski' });
    await expect(plBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(enBtn).toHaveAttribute('aria-pressed', 'false');

    // Click EN
    await enBtn.click();

    // Heading flips to English
    await expect(page.getByRole('heading', { name: 'Kindness Points' })).toBeVisible();
    await expect(page.getByText('Select class')).toBeVisible();

    // aria-pressed flips
    await expect(switcher.getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // <html lang> reflects the active language
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  });

  test('persists the chosen language across page reload', async ({ page }) => {
    await seedLang(page, 'pl');
    const token = readToken();
    await page.goto(`${BASE}/kindness-app/#/teacher?token=${token}`);

    await expect(page.getByRole('heading', { name: 'Punkty życzliwości' })).toBeVisible({
      timeout: 20_000,
    });

    // Switch to English
    await page.getByRole('button', { name: 'Angielski' }).click();
    await expect(page.getByRole('heading', { name: 'Kindness Points' })).toBeVisible();

    // localStorage should now hold the choice
    const stored = await page.evaluate(() => localStorage.getItem('kh-lang'));
    expect(stored).toBe('en');

    // Reload — the choice should survive
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Kindness Points' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  });

  test('switches back to Polish from English', async ({ page }) => {
    // Start the test in English, then switch to PL.
    await seedLang(page, 'en');
    const token = readToken();
    await page.goto(`${BASE}/kindness-app/#/teacher?token=${token}`);

    await expect(page.getByRole('heading', { name: 'Kindness Points' })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: 'Polski' }).click();

    await expect(page.getByRole('heading', { name: 'Punkty życzliwości' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl-PL');

    const stored = await page.evaluate(() => localStorage.getItem('kh-lang'));
    expect(stored).toBe('pl');
  });
});

test.describe('Language switcher — Heart page (public)', () => {

  test('switcher works on the unauthenticated heart page', async ({ page }) => {
    await seedLang(page, 'pl');
    await page.goto(`${BASE}/kindness-app/#/heart`);

    // Default Polish title (no token needed for heart page)
    await expect(page.getByRole('heading', { name: /Nasze Serce Życzliwości/ })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('Klasy')).toBeVisible();

    // Switch to English
    await page.getByRole('button', { name: 'Angielski' }).click();

    await expect(page.getByRole('heading', { name: /Our Kindness Heart/ })).toBeVisible();
    await expect(page.getByText('Classes')).toBeVisible();
    await expect(page.getByText(/school-wide/)).toBeVisible();
  });
});

test.describe('Language switcher — access-required gate', () => {

  test('switcher is also rendered (and works) on the access-required screen', async ({ page }) => {
    await seedLang(page, 'pl');
    await page.goto(`${BASE}/kindness-app/#/teacher`); // no token → access gate

    // Polish copy on the gate
    await expect(page.getByText('Wymagany dostęp')).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: 'Angielski' }).click();

    await expect(page.getByText('Access required')).toBeVisible();
  });
});
