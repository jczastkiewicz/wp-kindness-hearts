import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock hooks
vi.mock('../../api/wpApi.js', () => ({
  useTotal: () => ({ total: 0, loading: true, error: null, refresh: vi.fn() }),
  useClasses: () => ({ classes: [], loading: true, error: null, refresh: vi.fn() }),
}));

import HeartPage from '../HeartPage.jsx';

describe('HeartPage loading state', () => {
  it('shows spinner when loading both total and classes', () => {
    render(<HeartPage />);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });
});
