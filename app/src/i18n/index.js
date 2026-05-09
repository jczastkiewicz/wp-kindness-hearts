import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pl from './pl.json';
import en from './en.json';

const STORAGE_KEY = 'kh-lang';

/**
 * Resolve the initial UI language.
 *
 * Priority:
 *   1. User-selected language stored in localStorage (set by LanguageSwitcher)
 *   2. Locale injected by WordPress via window.WP_CONFIG.locale (BCP 47)
 *   3. Browser language (navigator.language)
 *   4. Polish (the default — see project decision: "first polish and english")
 *
 * The function is exported for tests so the precedence can be exercised
 * without touching globals directly.
 */
export function detectInitialLanguage() {
  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY);
    if (stored === 'pl' || stored === 'en') return stored;
  } catch {
    // localStorage may be blocked in some sandboxed contexts; ignore and
    // fall through to the next signal.
  }

  const fromWp = typeof window !== 'undefined' && window.WP_CONFIG && window.WP_CONFIG.locale;
  if (fromWp && /^en/i.test(fromWp)) return 'en';
  if (fromWp && /^pl/i.test(fromWp)) return 'pl';

  const fromBrowser =
    typeof navigator !== 'undefined' && navigator.language ? navigator.language : '';
  if (/^en/i.test(fromBrowser)) return 'en';

  return 'pl';
}

export const SUPPORTED_LANGUAGES = ['pl', 'en'];

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'pl',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false, // React already escapes
  },
  // Use Intl.PluralRules-style suffixes (one/few/many/other) so Polish
  // pluralisation works correctly. i18next ≥ v22 defaults to this.
  compatibilityJSON: 'v4',
});

/**
 * Persist a language choice. Called by LanguageSwitcher.
 */
export function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  i18n.changeLanguage(lang);
  try {
    window.localStorage?.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore — language change still applies for the current session
  }
  // Update <html lang> so screen readers/assistive tech read correct language
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'pl' ? 'pl-PL' : 'en-US';
  }
}

export default i18n;
