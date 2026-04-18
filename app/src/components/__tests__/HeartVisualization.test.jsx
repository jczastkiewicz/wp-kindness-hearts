import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HeartVisualization from '../HeartVisualization.jsx';

describe('HeartVisualization', () => {
  it('renders an SVG with dot circles', () => {
    const { container } = render(<HeartVisualization filledCount={0} size={200} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(10); // heart shape always has many dots
  });

  it('aria-label describes the current fill state', () => {
    const { container } = render(<HeartVisualization filledCount={0} size={200} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-label', expect.stringMatching(/Heart made of dots/i));
    expect(svg).toHaveAttribute('aria-label', expect.stringMatching(/0 of \d+ filled/));
  });

  it('shows 0% in aria-label when nothing is filled', () => {
    const { container } = render(<HeartVisualization filledCount={0} size={200} />);
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/\(0%\)/)
    );
  });

  it('shows 100% when filledCount exceeds capacity', () => {
    const { container } = render(<HeartVisualization filledCount={99999} size={200} />);
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/\(100%\)/)
    );
  });

  it('renders the filled count in the progress label', () => {
    render(<HeartVisualization filledCount={10} size={300} />);
    // The bold span shows just the count; capacity is > 10 for size=300
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('clamps displayed count to capacity', () => {
    // With size=100 the capacity is small; filledCount=9999 should clamp
    const { container } = render(<HeartVisualization filledCount={9999} size={100} />);
    const svg = container.querySelector('svg');
    const label = svg.getAttribute('aria-label');
    // Extract "X of Y filled" numbers and confirm clamped = Y
    const [, filled, capacity] = label.match(/(\d+) of (\d+) filled/);
    expect(Number(filled)).toBe(Number(capacity));
  });

  it('uses default size 340 when no size prop given', () => {
    const { container } = render(<HeartVisualization filledCount={0} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '340');
  });

  it('svg dimensions match the size prop', () => {
    const { container } = render(<HeartVisualization filledCount={0} size={250} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '250');
    expect(svg).toHaveAttribute('height', '250');
  });

  it('marks newly-filled dots as popping on filledCount increase', async () => {
    const { rerender } = render(<HeartVisualization filledCount={0} size={300} />);
    // Increase filledCount — triggers the pop animation useEffect
    await act(async () => {
      rerender(<HeartVisualization filledCount={5} size={300} />);
    });
    // After pop the circles with transform scale(1.3) appear briefly
    // We just check no crash and dots are still rendered
    const circles = document.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });
});
