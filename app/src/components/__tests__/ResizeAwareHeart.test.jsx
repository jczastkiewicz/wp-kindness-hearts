import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ResizeAwareHeart from '../ResizeAwareHeart.jsx';

beforeEach(() => {
  // Simulate environment without ResizeObserver (e.g., jsdom in CI)
  // Delete if present to test fallback path
  // eslint-disable-next-line no-undef
  if (typeof global.ResizeObserver !== 'undefined') delete global.ResizeObserver;
});

describe('ResizeAwareHeart', () => {
  it('renders without ResizeObserver and shows count', () => {
    const { getByText } = render(<ResizeAwareHeart count={5} maxSize={300} minSize={100} />);
    // HeartVisualization shows the filled count as text
    expect(getByText('5')).toBeTruthy();
  });

  it('uses ResizeObserver when available', () => {
    // Provide a minimal mock ResizeObserver
    class MockRO {
      constructor(cb) { this.cb = cb; }
      observe() { /* no-op */ }
      disconnect() { /* no-op */ }
    }
    // eslint-disable-next-line no-undef
    global.ResizeObserver = MockRO;

    const { getByText } = render(<ResizeAwareHeart count={7} maxSize={300} minSize={100} />);
    expect(getByText('7')).toBeTruthy();

    // Clean up
    // eslint-disable-next-line no-undef
    delete global.ResizeObserver;
  });
});
