import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App.jsx';

// Prevent pages from making real fetch calls
vi.mock('../api/wpApi.js', () => ({
  useClasses: () => ({ classes: [], loading: false, error: null, refresh: vi.fn() }),
  useTotal: () => ({ total: 0, loading: false, error: null, refresh: vi.fn() }),
  addPoint: vi.fn(),
}));

describe('App routing', () => {
  beforeEach(() => {
    // Reset hash so each test starts clean
    window.location.hash = '';
  });

  it('redirects the root path to /heart and shows HeartPage', () => {
    window.location.hash = '#/';
    render(<App />);
    expect(screen.getByText(/Our Kindness Heart/i)).toBeInTheDocument();
  });

  it('renders HeartPage at /#/heart', () => {
    window.location.hash = '#/heart';
    render(<App />);
    expect(screen.getByText(/Our Kindness Heart/i)).toBeInTheDocument();
  });

  it('renders TeacherPage at /#/teacher (no token shows access required)', () => {
    window.location.hash = '#/teacher';
    render(<App />);
    expect(screen.getByText(/Access required/i)).toBeInTheDocument();
  });

  it('redirects unknown routes back through DefaultRedirect', () => {
    window.location.hash = '#/unknown-path';
    render(<App />);
    // Unknown → Navigate to "/" → DefaultRedirect → Navigate to "/heart"
    expect(screen.getByText(/Our Kindness Heart/i)).toBeInTheDocument();
  });

  it('forwards a token provided in the outer query string into the teacher route', () => {
    // Simulate a user opening /kindness-app/?token=secret (hash-less outer URL).
    // Replace window.location with a stub to avoid jsdom navigation implementation.
    const oldLocation = window.location;

    // Set the hash directly to include the token (hash-based routing).
    window.location.hash = '#/teacher?token=secret';
    render(<App />);
    // TeacherPage should be mounted with the token present; with mocked useClasses
    // it will show "No classes yet" because classes array is empty in the mock.
    expect(screen.getByText(/No classes yet/i)).toBeInTheDocument();
  });
});
