import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HeartPage from '../HeartPage.jsx';

// Mock the API hooks so HeartPage never makes real fetch calls
vi.mock('../../api/wpApi.js', () => ({
  useTotal:   vi.fn(),
  useClasses: vi.fn(),
}));

import { useTotal, useClasses } from '../../api/wpApi.js';

beforeEach(() => {
  // Sensible defaults — each test overrides as needed
  useTotal.mockReturnValue({ total: 0, loading: false, error: null });
  useClasses.mockReturnValue({ classes: [], loading: false, error: null });
});

describe('HeartPage', () => {
  it('shows loading spinner while both hooks are loading', () => {
    useTotal.mockReturnValue({ total: 0, loading: true, error: null });
    useClasses.mockReturnValue({ classes: [], loading: true, error: null });
    const { container } = render(<HeartPage />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('does not show spinner when only one hook is still loading', () => {
    useTotal.mockReturnValue({ total: 0, loading: false, error: null });
    useClasses.mockReturnValue({ classes: [], loading: true, error: null });
    const { container } = render(<HeartPage />);
    expect(container.querySelector('.spinner')).not.toBeInTheDocument();
  });

  it('renders the page title', () => {
    render(<HeartPage />);
    expect(screen.getByText(/Our Kindness Heart/i)).toBeInTheDocument();
  });

  it('shows the school-wide total in the badge', () => {
    useTotal.mockReturnValue({ total: 42, loading: false, error: null });
    render(<HeartPage />);
    expect(screen.getByText(/42.*points school-wide/i)).toBeInTheDocument();
  });

  it('uses singular "point" when total is 1', () => {
    useTotal.mockReturnValue({ total: 1, loading: false, error: null });
    render(<HeartPage />);
    expect(screen.getByText(/1 point school-wide/i)).toBeInTheDocument();
  });

  it('shows the HeartVisualization component (SVG)', () => {
    render(<HeartPage />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render the leaderboard when there are no classes', () => {
    render(<HeartPage />);
    expect(screen.queryByRole('heading', { name: /classes/i })).not.toBeInTheDocument();
  });

  it('renders the classes leaderboard when classes are present', () => {
    useClasses.mockReturnValue({
      classes: [
        { id: 1, name: '3A', points: 5 },
        { id: 2, name: '3B', points: 3 },
      ],
      loading: false,
    });
    render(<HeartPage />);
    expect(screen.getByText('3A')).toBeInTheDocument();
    expect(screen.getByText('3B')).toBeInTheDocument();
  });

  it('sorts classes by points descending in the leaderboard', () => {
    useClasses.mockReturnValue({
      classes: [
        { id: 1, name: '3A', points: 3 },
        { id: 2, name: '3B', points: 10 },
      ],
      loading: false,
    });
    render(<HeartPage />);
    // 3B (10 pts) should appear before 3A (3 pts)
    const items = screen.getAllByText(/3[AB]/);
    expect(items[0]).toHaveTextContent('3B');
    expect(items[1]).toHaveTextContent('3A');
  });

  it('shows trophy emoji for the top class', () => {
    useClasses.mockReturnValue({
      classes: [{ id: 1, name: '3A', points: 5 }],
      loading: false,
    });
    render(<HeartPage />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('shows rank number for non-top classes', () => {
    useClasses.mockReturnValue({
      classes: [
        { id: 1, name: '3A', points: 10 },
        { id: 2, name: '3B', points: 5 },
      ],
      loading: false,
    });
    render(<HeartPage />);
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('shows auto-refresh note', () => {
    render(<HeartPage />);
    expect(screen.getByText(/auto-refreshes every 10 seconds/i)).toBeInTheDocument();
  });
});
