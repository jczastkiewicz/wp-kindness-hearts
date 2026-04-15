import { useMemo } from 'react';
import { useTotal, useClasses } from '../api/wpApi.js';
import HeartVisualization from '../components/HeartVisualization.jsx';

/**
 * HeartPage – the public display page.
 *
 * This is meant to be shown on a classroom or school projector/screen.
 * It auto-refreshes every 10 seconds and shows:
 *   - The heart filling up with dots (one dot per kindness point)
 *   - School-wide total
 *   - A table of classes with their individual scores
 */
export default function HeartPage() {
  const { total,   loading: loadingTotal   } = useTotal(10_000);
  const { classes, loading: loadingClasses } = useClasses();

  // Sorted classes – highest points first
  const sorted = useMemo(
    () => [...classes].sort((a, b) => b.points - a.points),
    [classes]
  );

  const loading = loadingTotal && loadingClasses;

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #fff5f5 0%, #fff 50%, #fff5f5 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px 48px',
        gap: 32,
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 5vw, 3rem)',
          fontWeight: 800,
          color: '#c0392b',
          lineHeight: 1.1,
        }}>
          Our Kindness Heart ❤️
        </h1>
        <p style={{ color: '#718096', marginTop: 8, fontSize: 'clamp(.85rem, 2vw, 1.05rem)' }}>
          Every dot represents one moment of kindness
        </p>
      </div>

      {/* Heart visualization */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <HeartVisualization
          filledCount={total}
          size={Math.min(560, window.innerWidth - 32)}
        />

        {/* Grand total badge */}
        <div style={{
          background: '#e53e3e',
          color: '#fff',
          borderRadius: 999,
          padding: '8px 24px',
          fontSize: '1.2rem',
          fontWeight: 700,
          boxShadow: '0 4px 16px rgba(229,62,62,.35)',
          marginTop: 4,
        }}>
          {total.toLocaleString()} {total === 1 ? 'point' : 'points'} school-wide!
        </div>
      </div>

      {/* Per-class leaderboard */}
      {sorted.length > 0 && (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '1.1rem',
            color: '#4a5568',
            marginBottom: 12,
            fontWeight: 600,
          }}>
            Classes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map((cls, i) => {
              const max = sorted[0]?.points || 1;
              const pct = max > 0 ? (cls.points / max) * 100 : 0;
              return (
                <div
                  key={cls.id}
                  style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: '10px 16px',
                    boxShadow: '0 1px 6px rgba(0,0,0,.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Rank */}
                  <span style={{
                    fontSize: '.85rem',
                    fontWeight: 700,
                    color: i === 0 ? '#e53e3e' : '#a0aec0',
                    width: 20,
                    textAlign: 'center',
                  }}>
                    {i === 0 ? '🏆' : `#${i + 1}`}
                  </span>

                  {/* Name + bar */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '.95rem', marginBottom: 4 }}>
                      {cls.name}
                    </div>
                    <div style={{
                      height: 6,
                      background: '#fed7d7',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: '#e53e3e',
                        borderRadius: 3,
                        transition: 'width .6s ease',
                      }} />
                    </div>
                  </div>

                  {/* Points */}
                  <span style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#e53e3e',
                    minWidth: 36,
                    textAlign: 'right',
                  }}>
                    {cls.points}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-refresh note */}
      <p style={{ color: '#cbd5e0', fontSize: '.75rem', textAlign: 'center' }}>
        Auto-refreshes every 10 seconds ↻
      </p>
    </div>
  );
}
