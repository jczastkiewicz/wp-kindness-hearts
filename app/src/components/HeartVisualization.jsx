import { useMemo, useEffect, useRef, useState } from 'react';

/**
 * HeartVisualization
 *
 * Renders a grid of dots arranged in a heart shape.
 * As `filledCount` grows, dots light up one by one (random order for playfulness).
 *
 * Props:
 *   filledCount  {number}  – how many dots to show filled
 *   maxDots      {number}  – override grid capacity (default: auto from grid)
 *   size         {number}  – grid dimension in pixels (default: 340)
 */
export default function HeartVisualization({ filledCount = 0, size = 340 }) {
  // ── Build the heart grid ────────────────────────────────────────────────
  const { positions, capacity } = useMemo(() => buildHeartGrid(size), [size]);

  // ── Stable random order for filling dots ────────────────────────────────
  const fillOrder = useMemo(() => shuffleArray(positions.map((_, i) => i)), [positions]);

  // ── Track which dots are "popping" (newly filled) ────────────────────────
  const prevFilledRef = useRef(0);
  const [poppingSet, setPoppingSet] = useState(new Set());

  useEffect(() => {
    const prev    = prevFilledRef.current;
    const clamped = Math.min(filledCount, capacity);
    const prevC   = Math.min(prev, capacity);

    if (clamped > prevC) {
      // New dots just filled in – mark them for the pop animation
      const newDots = new Set(fillOrder.slice(prevC, clamped));
      setPoppingSet(newDots);
      const timer = setTimeout(() => setPoppingSet(new Set()), 450);
      prevFilledRef.current = clamped;
      return () => clearTimeout(timer);
    }
    prevFilledRef.current = clamped;
  }, [filledCount, capacity, fillOrder]);

  const clamped    = Math.min(filledCount, capacity);
  const filledSet  = useMemo(
    () => new Set(fillOrder.slice(0, clamped)),
    [fillOrder, clamped]
  );
  const pct = capacity > 0 ? Math.round((clamped / capacity) * 100) : 0;

  const dotR = getDotRadius(size);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* SVG heart grid */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
        aria-label={`Heart made of dots: ${clamped} of ${capacity} filled (${pct}%)`}
      >
        {positions.map((pos, idx) => {
          const filled  = filledSet.has(idx);
          const popping = poppingSet.has(idx);
          return (
            <circle
              key={idx}
              cx={pos.x}
              cy={pos.y}
              r={dotR}
              fill={filled ? '#e53e3e' : '#fed7d7'}
              style={{
                transition: 'fill .4s ease',
                transform: popping ? 'scale(1.3)' : 'scale(1)',
                transformOrigin: `${pos.x}px ${pos.y}px`,
                transitionProperty: 'fill, transform',
                transitionDuration: popping ? '.35s, .35s' : '.4s, .3s',
              }}
            />
          );
        })}
      </svg>

      {/* Progress label */}
      <div style={{ textAlign: 'center' }}>
        <span style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#e53e3e',
        }}>
          {clamped.toLocaleString()}
        </span>
        <span style={{ color: '#718096', fontSize: '.9rem', marginLeft: 6 }}>
          / {capacity.toLocaleString()} dots ({pct}%)
        </span>
      </div>
    </div>
  );
}

// ── Heart shape helpers ───────────────────────────────────────────────────────

/**
 * Build a list of dot {x, y} positions that fall inside a heart shape.
 *
 * Uses the parametric heart inequality:
 *   (x² + y² - 1)³ ≤ x² · y³
 * with x ∈ [-1.2, 1.2], y ∈ [-1.3, 1.0] (flipped for screen coords).
 */
function buildHeartGrid(size) {
  const dotR    = getDotRadius(size);
  const spacing = dotR * 2 + dotR * 0.8; // diameter + generous gap = clearly separate dots
  const cols    = Math.floor(size / spacing);
  const rows    = Math.floor(size / spacing);
  const offsetX = (size - cols * spacing) / 2 + dotR;
  const offsetY = (size - rows * spacing) / 2 + dotR;

  const positions = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // pixel coords
      const px = offsetX + col * spacing;
      const py = offsetY + row * spacing;

      // Normalize to [-1.3, 1.3] × [-1.25, 1.5]
      // Push ny ceiling higher to show more of the top bumps
      const nx =  ((px / size) * 2.6) - 1.3;
      const ny = -((py / size) * 2.75) + 1.5;   // flip Y so heart is right-way up

      if (isInsideHeart(nx, ny)) {
        positions.push({ x: px, y: py });
      }
    }
  }

  return { positions, capacity: positions.length };
}

/** Returns true if (x, y) is inside the heart: (x²+y²-1)³ ≤ x²·y³ */
function isInsideHeart(x, y) {
  const a = x * x + y * y - 1;
  return a * a * a <= x * x * y * y * y;
}

function getDotRadius(size) {
  // Scale dot size with overall container size (smaller = more dots)
  return Math.max(2, Math.round(size / 110));
}

/** Fisher-Yates shuffle (returns new array) */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
