/**
 * Unit tests for the LanguageSwitcher component.
 *
 * Covers: rendering both buttons, the data-lang attribute hook used by
 * Playwright tests, aria-pressed reflecting the active language, and the
 * click-to-switch flow that calls setLanguage().
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../../i18n/index.js';
import LanguageSwitcher from '../LanguageSwitcher.jsx';

describe('LanguageSwitcher', () => {
  let originalLang;

  beforeEach(async () => {
    originalLang = i18n.language;
    window.localStorage.removeItem('kh-lang');
    await i18n.changeLanguage('en'); // tests assert against English labels
  });

  afterEach(async () => {
    await i18n.changeLanguage(originalLang);
  });

  it('renders one button per supported language with stable data-lang hooks', () => {
    render(<LanguageSwitcher />);
    expect(document.querySelector('[data-lang="pl"]')).toBeInTheDocument();
    expect(document.querySelector('[data-lang="en"]')).toBeInTheDocument();
  });

  it('marks the active language button via aria-pressed', () => {
    render(<LanguageSwitcher />);
    const en = document.querySelector('[data-lang="en"]');
    const pl = document.querySelector('[data-lang="pl"]');
    expect(en).toHaveAttribute('aria-pressed', 'true');
    expect(pl).toHaveAttribute('aria-pressed', 'false');
  });

  it('exposes a localized accessible group label', () => {
    render(<LanguageSwitcher />);
    // English context → "Language"
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
  });

  it('clicking PL switches the language, persists, and flips aria-pressed', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(document.querySelector('[data-lang="pl"]'));

    expect(i18n.language).toBe('pl');
    expect(window.localStorage.getItem('kh-lang')).toBe('pl');
    expect(document.querySelector('[data-lang="pl"]')).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('[data-lang="en"]')).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking EN switches the language and updates <html lang>', async () => {
    await i18n.changeLanguage('pl');
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(document.querySelector('[data-lang="en"]'));

    expect(i18n.language).toBe('en');
    expect(document.documentElement.lang).toBe('en-US');
  });
});
