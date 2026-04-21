import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TeacherPage from '../TeacherPage.jsx';

vi.mock('../../api/wpApi.js', () => ({
  useClasses: vi.fn(),
  addPoint: vi.fn(),
}));

import { useClasses, addPoint } from '../../api/wpApi.js';

const twoClasses = [
  { id: 1, name: '3A', points: 5 },
  { id: 2, name: '3B', points: 3 },
];

function renderTeacher(token = '') {
  const path = `/teacher${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/teacher" element={<TeacherPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useClasses.mockReturnValue({ classes: twoClasses, loading: false, error: null });
});

describe('TeacherPage — extra behaviors', () => {
  it('shows flash and updates live region when addPoint succeeds', async () => {
    addPoint.mockResolvedValue({ class_id: 1, class_points: 6, total_points: 20 });
    renderTeacher('tok');

    // Click heart and wait for UI to update
    fireEvent.click(screen.getByRole('button', { name: /kindness point/i }));

    await waitFor(() => expect(screen.getByText('6')).toBeInTheDocument());

    // Flash feedback should be visible immediately after success
    expect(document.querySelector('.feedback-flash')).toBeInTheDocument();

    // Live region should contain the success announcement
    const live = screen.getByRole('status');
    await waitFor(() => expect(live).toHaveTextContent(/Added a point to/i));
  });

  it('disables the add button while addPoint is pending and re-enables after', async () => {
    let resolvePromise;
    addPoint.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    renderTeacher('tok');
    const btn = screen.getByRole('button', { name: /kindness point/i });

    // Click and check it becomes disabled while promise is pending
    fireEvent.click(btn);
    expect(btn).toBeDisabled();

    // Resolve the pending addPoint and wait for the button to re-enable
    resolvePromise({ class_id: 1, class_points: 6, total_points: 20 });
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
