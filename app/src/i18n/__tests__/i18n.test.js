/**
 * Unit tests for the i18n module — detectInitialLanguage() precedence rules
 * and setLanguage() side effects (localStorage + <html lang>).
 *
 * Why direct exports rather than re-importing the module: importing
 * '../index.js' triggers i18next.init() once at module load. Re-importing
 * via vi.resetModules() is brittle (it re-registers the singleton). Instead
 * we exercise the pure functions directly, controlling globals per test.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import i18n, { detectInitialLanguage, setLanguage, SUPPORTED_LANGUAGES } from '../index.js';

const STORAGE_KEY = 'kh-lang';

describe('detectInitialLanguage', () => {
  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    delete window.WP_CONFIG;
  });

  it('returns the localStorage value when set to a supported lang', () => {
    window.localStorage.setItem(STORAGE_KEY, 'pl');
    expect(detectInitialLanguage()).toBe('pl');

    window.localStorage.setItem(STORAGE_KEY, 'en');
    expect(detectInitialLanguage()).toBe('en');
  });

  it('ignores localStorage values outside the supported set', () => {
    window.localStorage.setItem(STORAGE_KEY, 'fr');
    // Force navigator and WP_CONFIG to "no signal" so we observe the
    // localStorage branch is actually skipped (rather than coincidentally
    // landing on whatever jsdom defaults to).
    const spy = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
    expect(detectInitialLanguage()).toBe('pl');
    spy.mockRestore();
  });

  it('falls back to WP_CONFIG.locale when localStorage is empty', () => {
    window.WP_CONFIG = { locale: 'en-US' };
    expect(detectInitialLanguage()).toBe('en');

    window.WP_CONFIG = { locale: 'pl-PL' };
    expect(detectInitialLanguage()).toBe('pl');
  });

  it('matches WP_CONFIG.locale by language prefix (case-insensitive)', () => {
    window.WP_CONFIG = { locale: 'EN-gb' };
    expect(detectInitialLanguage()).toBe('en');

    window.WP_CONFIG = { locale: 'pl' };
    expect(detectInitialLanguage()).toBe('pl');
  });

  it('falls back to navigator.language when localStorage and WP_CONFIG are empty', () => {
    const spy = vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
    expect(detectInitialLanguage()).toBe('en');
    spy.mockRestore();
  });

  it('returns Polish as the final fallback when nothing else matches', () => {
    const spy = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
    expect(detectInitialLanguage()).toBe('pl');
    spy.mockRestore();
  });

  it('treats a missing WP_CONFIG.locale as "no signal"', () => {
    window.WP_CONFIG = {}; // present but no locale field
    const spy = vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    expect(detectInitialLanguage()).toBe('en');
    spy.mockRestore();
  });

  it('survives a localStorage that throws (sandboxed contexts)', () => {
    const spy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    // With localStorage broken, falls back through the rest of the chain
    window.WP_CONFIG = { locale: 'pl-PL' };
    expect(detectInitialLanguage()).toBe('pl');
    spy.mockRestore();
  });
});

describe('setLanguage', () => {
  let originalLang;

  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    originalLang = i18n.language;
  });

  afterEach(() => {
    // Restore i18n state so other tests aren't affected
    i18n.changeLanguage(originalLang);
  });

  it('changes the active i18next language', () => {
    setLanguage('pl');
    expect(i18n.language).toBe('pl');

    setLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('persists the choice to localStorage', () => {
    setLanguage('en');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en');

    setLanguage('pl');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('pl');
  });

  it('updates <html lang> for assistive tech', () => {
    setLanguage('en');
    expect(document.documentElement.lang).toBe('en-US');

    setLanguage('pl');
    expect(document.documentElement.lang).toBe('pl-PL');
  });

  it('rejects unsupported languages without side effects', () => {
    setLanguage('en'); // establish a known starting state
    const before = i18n.language;
    setLanguage('fr');
    expect(i18n.language).toBe(before); // unchanged
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en'); // unchanged
  });

  it('still applies the language change when localStorage throws', () => {
    const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    setLanguage('en');
    expect(i18n.language).toBe('en');
    expect(document.documentElement.lang).toBe('en-US');
    spy.mockRestore();
  });
});

describe('SUPPORTED_LANGUAGES', () => {
  it('exports exactly the two locales we ship with', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['pl', 'en']);
  });
});
