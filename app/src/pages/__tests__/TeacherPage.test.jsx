import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TeacherPage from '../TeacherPage.jsx';

vi.mock('../../api/wpApi.js', () => ({
  useClasses: vi.fn(),
  addPoint:   vi.fn(),
}));

import { useClasses, addPoint } from '../../api/wpApi.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const twoClasses = [
  { id: 1, name: '3A', points: 5 },
  { id: 2, name: '3B', points: 3 },
];

beforeEach(() => {
  vi.clearAllMocks();
  useClasses.mockReturnValue({ classes: [], loading: false, error: null });
});

// ── Guard states ──────────────────────────────────────────────────────────────

describe('TeacherPage — guard states', () => {
  it('shows "Access required" when no token in URL', () => {
    renderTeacher('');
    expect(screen.getByText(/Access required/i)).toBeInTheDocument();
  });

  it('shows a spinner while classes are loading', () => {
    useClasses.mockReturnValue({ classes: [], loading: true, error: null });
    const { container } = renderTeacher('tok');
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('shows error card when class load fails', () => {
    useClasses.mockReturnValue({ classes: [], loading: false, error: 'Network error' });
    renderTeacher('tok');
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows "No classes yet" when classes array is empty', () => {
    renderTeacher('tok');
    expect(screen.getByText(/No classes yet/i)).toBeInTheDocument();
  });
});

// ── Main UI ───────────────────────────────────────────────────────────────────

describe('TeacherPage — main panel', () => {
  beforeEach(() => {
    useClasses.mockReturnValue({ classes: twoClasses, loading: false, error: null });
  });

  it('renders the page heading', () => {
    renderTeacher('tok');
    expect(screen.getByText(/Kindness Points/i)).toBeInTheDocument();
  });

  it('renders all classes in the dropdown', () => {
    renderTeacher('tok');
    expect(screen.getByText('3A')).toBeInTheDocument();
    expect(screen.getByText('3B')).toBeInTheDocument();
  });

  it('auto-selects the first class and shows its point count', () => {
    renderTeacher('tok');
    // Class 3A has 5 points — should appear in the points display
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders the heart award button', () => {
    renderTeacher('tok');
    expect(screen.getByRole('button', { name: /kindness point/i })).toBeInTheDocument();
  });

  it('updates point display after successful addPoint', async () => {
    addPoint.mockResolvedValue({ class_id: 1, class_points: 6, total_points: 20 });
    renderTeacher('mytoken');
    fireEvent.click(screen.getByRole('button', { name: /kindness point/i }));
    await waitFor(() => expect(screen.getByText('6')).toBeInTheDocument());
    expect(screen.getByText(/20.*school-wide/i)).toBeInTheDocument();
  });

  it('calls addPoint with classId and the URL token', async () => {
    addPoint.mockResolvedValue({ class_id: 1, class_points: 6, total_points: 20 });
    renderTeacher('secret123');
    fireEvent.click(screen.getByRole('button', { name: /kindness point/i }));
    await waitFor(() => expect(addPoint).toHaveBeenCalledWith(1, 'secret123'));
  });

  it('shows error message when addPoint rejects', async () => {
    addPoint.mockRejectedValue(new Error('Invalid token. Please rescan the QR code.'));
    renderTeacher('badtoken');
    fireEvent.click(screen.getByRole('button', { name: /kindness point/i }));
    await waitFor(() =>
      expect(screen.getByText(/Invalid token/i)).toBeInTheDocument()
    );
  });

  it('clears addError when class selection changes', async () => {
    addPoint.mockRejectedValue(new Error('Invalid token. Please rescan the QR code.'));
    renderTeacher('badtoken');
    fireEvent.click(screen.getByRole('button', { name: /kindness point/i }));
    await waitFor(() => expect(screen.getByText(/Invalid token/i)).toBeInTheDocument());

    // Change class selection — error should clear
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    expect(screen.queryByText(/Invalid token/i)).not.toBeInTheDocument();
  });
});
