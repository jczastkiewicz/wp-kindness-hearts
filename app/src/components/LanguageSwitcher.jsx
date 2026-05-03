import { useTranslation } from 'react-i18next';
import { setLanguage, SUPPORTED_LANGUAGES } from '../i18n/index.js';

/**
 * Small fixed-position language switcher rendered in the top-right corner of
 * each page. Two short buttons (PL / EN) so the control fits on phones and
 * is unambiguous regardless of the active language.
 *
 * Choice is persisted in localStorage by setLanguage().
 */
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language || 'pl';

  return (
    <div
      role="group"
      aria-label={t('lang.switcherLabel')}
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 50,
        display: 'flex',
        gap: 4,
        background: 'rgba(255,255,255,.85)',
        backdropFilter: 'blur(6px)',
        padding: 4,
        borderRadius: 999,
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
        fontSize: '.78rem',
        fontWeight: 700,
      }}
    >
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = lng === current;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => setLanguage(lng)}
            aria-pressed={active}
            aria-label={
              lng === 'pl' ? t('lang.polish') : t('lang.english')
            }
            style={{
              border: 'none',
              cursor: active ? 'default' : 'pointer',
              padding: '4px 10px',
              borderRadius: 999,
              background: active ? '#e53e3e' : 'transparent',
              color: active ? '#fff' : '#4a5568',
              minWidth: 32,
              fontWeight: 700,
              fontSize: '.78rem',
              letterSpacing: '.04em',
            }}
          >
            {t(`lang.short.${lng}`)}
          </button>
        );
      })}
    </div>
  );
}
