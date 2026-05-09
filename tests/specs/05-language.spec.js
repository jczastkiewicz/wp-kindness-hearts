/**
 * 05 – Language switcher (PL / EN)
 *
 * Tests the in-app language switcher rendered on both the teacher and heart
 * pages. Each test seeds localStorage's `kh-lang` key before navigating so
 * the starting language is deterministic regardless of the WordPress site
 * locale or browser language. The seeded value has the highest precedence
 * in detectInitialLanguage() — see app/src/i18n/index.js.
 *
 * Selectors note: the LanguageSwitcher buttons have stable `data-lang="pl"`
 * and `data-lang="en"` attributes specifically so tests don't have to chase
 * the localized aria-label (which itself changes when the language changes).
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
 * Force the app to boot in a known language by seeding localStorage. The
 * seeded value has the highest precedence in detectInitialLanguage().
 *
 * IMPORTANT: addInitScript runs on every navigation in the same context,
 * including page.reload(). To avoid clobbering a user-changed value during
 * persistence tests, we only set the key when it isn't already present.
 */
async function seedLang(page, lang) {
  await page.addInitScript((value) => {
    try {
      if (!localStorage.getItem('kh-lang')) {
        localStorage.setItem('kh-lang', value);
      }
    } catch {
      // ignore — sandboxed contexts may block localStorage; the test will
      // simply fall back to whatever WP_CONFIG/browser detection picks
    }
  }, lang);
}

// Locale-stable selectors (rely on data-lang attribute, not translated labels)
const plButton = (page) => page.locator('[data-lang="pl"]');
const enButton = (page) => page.locator('[data-lang="en"]');

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
    const switcher = page.getByRole('group');
    await expect(switcher).toBeVisible();
    await expect(plButton(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(enButton(page)).toHaveAttribute('aria-pressed', 'false');

    // Click EN
    await enButton(page).click();

    // Heading flips to English
    await expect(page.getByRole('heading', { name: 'Kindness Points' })).toBeVisible();
    await expect(page.getByText('Select class')).toBeVisible();

    // aria-pressed flips
    await expect(enButton(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(plButton(page)).toHaveAttribute('aria-pressed', 'false');

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
    await enButton(page).click();
    await expect(page.getByRole('heading', { name: 'Kindness Points' })).toBeVisible();

    // localStorage should now hold the choice
    const stored = await page.evaluate(() => localStorage.getItem('kh-lang'));
    expect(stored).toBe('en');

    // Reload — the choice should survive (seedLang's init script is guarded
    // to only seed when localStorage is empty, so it won't clobber 'en')
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

    await plButton(page).click();

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
    await enButton(page).click();

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

    await enButton(page).click();

    await expect(page.getByText('Access required')).toBeVisible();
  });
});
