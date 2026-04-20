import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HeartPage from '../HeartPage.jsx';
import { vi } from 'vitest';

// Mock hooks to provide deterministic data
vi.mock('../../api/wpApi.js', () => ({
  useTotal: () => ({ total: 5, loading: false, error: null, refresh: vi.fn() }),
  useClasses: () => ({
    classes: [
      { id: 1, name: 'Class A', points: 5 },
      { id: 2, name: 'Class B', points: 2 },
    ],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

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
});
