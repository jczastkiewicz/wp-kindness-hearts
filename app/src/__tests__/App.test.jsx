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
    // Simulate opening /kindness-app/?token=secret and landing on root — DefaultRedirect
    window.history.pushState({}, '', '/?token=secret');
    window.location.hash = '#/';
    render(<App />);
    // With the mocked useClasses (empty) teacher page should show "No classes yet"
    expect(screen.getByText(/No classes yet/i)).toBeInTheDocument();
  });
});
