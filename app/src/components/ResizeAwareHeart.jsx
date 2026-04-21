import { useEffect, useRef, useState } from 'react';
import HeartVisualization from './HeartVisualization.jsx';

export default function ResizeAwareHeart({ count, maxSize = 560, minSize = 280 }) {
  const ref = useRef(null);
  // Start with a safe default and compute the real size after mount.
  const [width, setWidth] = useState(maxSize);

  useEffect(() => {
    const el = ref.current;

    // If ResizeObserver is available use it; otherwise fall back to a
    // window 'resize' listener and read the element's clientWidth.
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.round(entry.contentRect.width);
          setWidth(Math.max(minSize, Math.min(maxSize, w)));
        }
      });
      if (el) ro.observe(el);
      // Initialise after mount using the observed size (or fallback width).
      setTimeout(() => {
        const w = Math.round((el && el.clientWidth) || (typeof window !== 'undefined' ? window.innerWidth - 32 : maxSize));
        setWidth(Math.max(minSize, Math.min(maxSize, w)));
      }, 0);
      return () => ro.disconnect();
    }

    // Fallback for test environments (jsdom) or older browsers
    function onResize() {
      const w = Math.round((el && el.clientWidth) || (typeof window !== 'undefined' ? window.innerWidth - 32 : maxSize));
      setWidth(Math.max(minSize, Math.min(maxSize, w)));
    }

    window.addEventListener('resize', onResize);
    // Run once to initialise
    setTimeout(onResize, 0);
    return () => window.removeEventListener('resize', onResize);
  }, [minSize, maxSize]);

  return (
    <div ref={ref} style={{ width: 'clamp(' + minSize + 'px, 90vw, ' + maxSize + 'px)' }}>
      <HeartVisualization filledCount={count} size={width} />
    </div>
  );
}
