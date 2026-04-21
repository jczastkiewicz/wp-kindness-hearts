import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import HeartPage from '../HeartPage.jsx';

// Create mock functions so individual tests can override return values
const mockUseTotal = vi.fn();
const mockUseClasses = vi.fn();
vi.mock('../../api/wpApi.js', () => ({
  useTotal: () => mockUseTotal(),
  useClasses: () => mockUseClasses(),
}));

beforeEach(() => {
  // Default stable return values
  mockUseTotal.mockReturnValue({ total: 5, loading: false, error: null, refresh: vi.fn() });
  mockUseClasses.mockReturnValue({
    classes: [
      { id: 1, name: 'Class A', points: 5 },
      { id: 2, name: 'Class B', points: 2 },
    ],
    loading: false,
    error: null,
    refresh: vi.fn(),
  });
});

describe('HeartPage (unit)', () => {
  it('renders total and class leaderboard correctly', () => {
    render(<HeartPage />);

    // Title and grand total badge
    expect(screen.getByText(/Our Kindness Heart/i)).toBeInTheDocument();
    expect(screen.getByText(/5\s+points?\s+school-wide/i)).toBeInTheDocument();

    // Class names should be present
    expect(screen.getByText('Class A')).toBeInTheDocument();
    expect(screen.getByText('Class B')).toBeInTheDocument();
  });

  it('shows loading spinner when both total and classes are loading', () => {
    mockUseTotal.mockReturnValue({ total: 0, loading: true, error: null, refresh: vi.fn() });
    mockUseClasses.mockReturnValue({ classes: [], loading: true, error: null, refresh: vi.fn() });
    const { container } = render(<HeartPage />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('uses singular "point" when total is 1', () => {
    mockUseTotal.mockReturnValue({ total: 1, loading: false, error: null, refresh: vi.fn() });
    mockUseClasses.mockReturnValue({ classes: [], loading: false, error: null, refresh: vi.fn() });
    render(<HeartPage />);
    expect(screen.getByText(/1\s+point\s+school-wide/i)).toBeInTheDocument();
  });
});
