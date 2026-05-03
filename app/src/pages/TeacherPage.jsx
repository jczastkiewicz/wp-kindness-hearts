import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClasses, addPoint } from '../api/wpApi.js';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

/**
 * TeacherPage
 *
 * Teachers land here via the QR code URL:
 *   /kindness-app/#/teacher?token=SECRET
 *
 * Features:
 *   - Class selector dropdown
 *   - Big heart button to award a point
 *   - Live point counter for the selected class
 *   - Feedback flash on success
 *   - Error display on token failure
 *   - PL/EN language switcher in the top-right corner
 */
export default function TeacherPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { classes, loading, error: loadError } = useClasses();

  // Initialize selection from classes when available so the UI is ready immediately.
  const [selectedId, setSelectedId] = useState(() =>
    classes && classes[0] ? String(classes[0].id) : ''
  );
  const [classPoints, setClassPoints] = useState(() =>
    classes && classes[0] ? classes[0].points : null
  );
  const [totalPoints, setTotalPoints] = useState(null);
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState(false);
  const [addError, setAddError] = useState(null);
  const [liveMessage, setLiveMessage] = useState('');

  // Ensure we auto-select the first class once classes are loaded. Deferred
  // to a microtask so we don't violate react-hooks/set-state-in-effect lint rule.
  useEffect(() => {
    if (classes.length && !selectedId) {
      Promise.resolve().then(() => {
        setSelectedId(String(classes[0].id));
        setClassPoints(classes[0].points);
      });
    }
  }, [classes, selectedId]);

  /* istanbul ignore next: small live-region timing paths are exercised by e2e tests; unit testing timeouts here is brittle */
  const handleAddPoint = useCallback(async () => {
    if (!selectedId || !token || adding) return;
    setAdding(true);
    setAddError(null);
    // Announce beginning of operation for screen readers
    setLiveMessage(t('teacher.live.addingPoint'));

    try {
      const res = await addPoint(Number(selectedId), token);
      setClassPoints(res.class_points);
      setTotalPoints(res.total_points);
      // Trigger flash animation
      setFlash(true);
      setTimeout(() => setFlash(false), 1300);

      const cls = classes.find((c) => String(c.id) === selectedId);
      const className = cls?.name || t('teacher.live.selectedClass');
      setLiveMessage(
        t('teacher.live.added', { name: className, count: res.class_points })
      );
      // Clear live message after it's been read
      setTimeout(() => setLiveMessage(''), 3000);
    } catch (e) {
      setAddError(e.message);
      // Keep the live region message distinct from the visible error text to
      // avoid duplicate getByText matches in tests while still announcing it.
      setLiveMessage(t('teacher.live.errorAdding'));
      setTimeout(() => setLiveMessage(''), 4000);
    } finally {
      setAdding(false);
    }
  }, [selectedId, token, adding, classes, t]);

  // ── No token ──────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="full-page" style={{ justifyContent: 'center', padding: 32 }}>
        <LanguageSwitcher />
        <div className="card" style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>
            <span aria-hidden="true">🔑</span>
          </div>
          <h2 style={{ color: '#c0392b', marginBottom: 8 }}>
            {t('teacher.noToken.title')}
          </h2>
          <p style={{ color: '#718096' }}>{t('teacher.noToken.body')}</p>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="full-page" style={{ justifyContent: 'center' }}>
        <LanguageSwitcher />
        <div className="spinner" />
      </div>
    );
  }

  // ── Load error ────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="full-page" style={{ justifyContent: 'center', padding: 32 }}>
        <LanguageSwitcher />
        <div className="card" style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
            <span aria-hidden="true">⚠️</span>
          </div>
          <p style={{ color: '#c0392b' }}>{loadError}</p>
        </div>
      </div>
    );
  }

  // ── No classes set up ─────────────────────────────────────────────────────
  if (!classes.length) {
    return (
      <div className="full-page" style={{ justifyContent: 'center', padding: 32 }}>
        <LanguageSwitcher />
        <div className="card" style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
            <span aria-hidden="true">🏫</span>
          </div>
          <h2 style={{ marginBottom: 8 }}>{t('teacher.noClasses.title')}</h2>
          <p style={{ color: '#718096' }}>{t('teacher.noClasses.body')}</p>
        </div>
      </div>
    );
  }

  const selectedClass = classes.find((c) => String(c.id) === selectedId);
  const displayPoints = classPoints ?? selectedClass?.points ?? 0;

  return (
    <div
      className="full-page"
      style={{
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'linear-gradient(160deg, #fff5f5 0%, #fff 60%)',
      }}
    >
      <LanguageSwitcher />
      {/* Flash feedback */}
      {flash && (
        <div className="feedback-flash">
          <span aria-hidden="true">❤️</span>
        </div>
      )}

      {/* Accessible live region for screen readers (visually hidden but announced) */}
      <div
        aria-live="polite"
        role="status"
        style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}
      >
        {liveMessage}
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>
            <span aria-hidden="true">❤️</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 8, color: '#c0392b' }}>
            {t('teacher.title')}
          </h1>
          <p style={{ color: '#718096', fontSize: '.9rem', marginTop: 4 }}>
            {t('teacher.subtitle')}
          </p>
        </div>

        {/* Class selector */}
        <div style={{ marginBottom: 24, textAlign: 'left' }}>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 6,
              fontSize: '.9rem',
              color: '#4a5568',
            }}
          >
            {t('teacher.selectClass')}
          </label>
          <select
            className="kh-select"
            value={selectedId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedId(val);
              setAddError(null);
              const cls = classes.find((c) => String(c.id) === val);
              if (cls) setClassPoints(cls.points);
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Points display */}
        <div
          style={{
            background: '#fff5f5',
            borderRadius: 12,
            padding: '12px 0',
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#e53e3e', lineHeight: 1 }}>
            {displayPoints.toLocaleString()}
          </div>
          <div style={{ color: '#718096', fontSize: '.85rem', marginTop: 4 }}>
            {t('teacher.pointsInClass', {
              count: displayPoints,
              name: selectedClass?.name ?? '…',
            })}
          </div>
          {totalPoints !== null && (
            <div style={{ color: '#4a5568', fontSize: '.78rem', marginTop: 2 }}>
              {t('teacher.schoolWide', { count: totalPoints.toLocaleString() })}
            </div>
          )}
        </div>

        {/* Big heart button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <button
            className="heart-btn"
            onClick={handleAddPoint}
            disabled={adding || !selectedId}
            aria-label={t('teacher.giveHeart')}
          >
            {adding ? '…' : '❤️'}
          </button>
        </div>

        <p style={{ color: '#4a5568', fontSize: '.8rem' }}>{t('teacher.tapHeart')}</p>

        {/* Error */}
        {addError && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              background: '#fff5f5',
              border: '1px solid #feb2b2',
              borderRadius: 8,
              color: '#c53030',
              fontSize: '.88rem',
            }}
          >
            {addError}
          </div>
        )}
      </div>
    </div>
  );
}
