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
});
