import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the wpApi module used by TeacherPage
vi.mock('../../api/wpApi.js', () => ({
  useClasses: () => ({
    classes: [{ id: 1, name: '3A', points: 0 }],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
  useTotal: () => ({ total: 0, loading: false, error: null, refresh: vi.fn() }),
  addPoint: vi.fn(),
}));

import TeacherPage from '../TeacherPage.jsx';
import { addPoint } from '../../api/wpApi.js';

describe('TeacherPage — addPoint flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('awards a point successfully and updates UI', async () => {
    // make addPoint resolve with expected payload
    addPoint.mockResolvedValueOnce({ class_id: 1, class_points: 1, total_points: 1 });

    render(
      <MemoryRouter initialEntries={['/teacher?token=secret']}>
        <Routes>
          <Route path="/teacher" element={<TeacherPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Heart button should be present
    const btn = await screen.findByRole('button', { name: /Give a kindness point/i });
    expect(btn).toBeInTheDocument();

    // Click the heart
    fireEvent.click(btn);

    // addPoint should have been called with numeric class id and the token
    await waitFor(() => expect(addPoint).toHaveBeenCalledWith(1, 'secret'));

    // The displayed points should update to 1 (the big number in the card)
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());

    // Flash emoji should appear briefly (feedback-flash element)
    expect(document.querySelector('.feedback-flash')).toBeInTheDocument();

    // Live region should announce the addition
    const live = screen.getByRole('status');
    await waitFor(() => expect(live).toHaveTextContent(/Added a point/i));
  });

  it('shows an error message when addPoint fails', async () => {
    addPoint.mockRejectedValueOnce(new Error('Invalid token. Please rescan the QR code.'));

    render(
      <MemoryRouter initialEntries={['/teacher?token=secret']}>
        <Routes>
          <Route path="/teacher" element={<TeacherPage />} />
        </Routes>
      </MemoryRouter>
    );

    const btn = await screen.findByRole('button', { name: /Give a kindness point/i });
    fireEvent.click(btn);

    // Expect error container to show the message
    await waitFor(() => expect(screen.getByText(/Invalid token/i)).toBeInTheDocument());

    // Live region should announce a generic error message (not duplicate the visible text)
    const live = screen.getByRole('status');
    await waitFor(() => expect(live).toHaveTextContent(/An error occurred/i));
  });

  it('announces when adding starts', async () => {
    // Mock addPoint to resolve after a short delay so we can verify the "adding" announcement
    addPoint.mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve({ class_id: 1, class_points: 2, total_points: 2 }), 50)));

    render(
      <MemoryRouter initialEntries={['/teacher?token=secret']}>
        <Routes>
          <Route path="/teacher" element={<TeacherPage />} />
        </Routes>
      </MemoryRouter>
    );

    const btn = await screen.findByRole('button', { name: /Give a kindness point/i });
    fireEvent.click(btn);

    const live = screen.getByRole('status');
    // The live region should announce the start of the add operation immediately
    await waitFor(() => expect(live).toHaveTextContent(/Adding a kindness point/i));

    // Wait for the mocked addPoint to finish and the success announcement
    await waitFor(() => expect(live).toHaveTextContent(/Added a point/i));
  });
});
