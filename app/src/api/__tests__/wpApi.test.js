import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { fetchClasses, addPoint, fetchTotal, useClasses, useTotal } from '../wpApi.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockFetch(data, { ok = true, status = 200 } = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok, status, json: () => Promise.resolve(data) }))
  );
}

afterEach(() => vi.unstubAllGlobals());

// ── fetchClasses ──────────────────────────────────────────────────────────────

describe('fetchClasses', () => {
  it('returns class array on success', async () => {
    mockFetch([{ id: 1, name: '3A', points: 5 }]);
    expect(await fetchClasses()).toEqual([{ id: 1, name: '3A', points: 5 }]);
  });

  it('throws on non-ok response', async () => {
    mockFetch(null, { ok: false });
    await expect(fetchClasses()).rejects.toThrow('Failed to load classes');
  });
});

// ── fetchTotal ────────────────────────────────────────────────────────────────

describe('fetchTotal', () => {
  it('returns the numeric total', async () => {
    mockFetch({ total: 42 });
    expect(await fetchTotal()).toBe(42);
  });

  it('throws on non-ok response', async () => {
    mockFetch(null, { ok: false });
    await expect(fetchTotal()).rejects.toThrow('Failed to load total');
  });
});

// ── addPoint ──────────────────────────────────────────────────────────────────

describe('addPoint', () => {
  it('returns API payload on success', async () => {
    const data = { class_id: 1, class_points: 6, total_points: 20 };
    mockFetch(data);
    expect(await addPoint(1, 'tok')).toEqual(data);
  });

  it('throws "Invalid token" message on 403', async () => {
    mockFetch(null, { ok: false, status: 403 });
    await expect(addPoint(1, 'bad')).rejects.toThrow('Invalid token');
  });

  it('throws generic message on other failures', async () => {
    mockFetch(null, { ok: false, status: 500 });
    await expect(addPoint(1, 'tok')).rejects.toThrow('Failed to add point');
  });

  it('sends token in X-KHearts-Token header', async () => {
    mockFetch({ class_id: 1, class_points: 1, total_points: 1 });
    await addPoint(1, 'secret');
    const [, init] = fetch.mock.calls[0];
    expect(init.headers['X-KHearts-Token']).toBe('secret');
  });

  it('does not encode token in query string (token sent in header only)', async () => {
    mockFetch({ class_id: 1, class_points: 1, total_points: 1 });
    await addPoint(1, 'my token');
    const [fetchUrl] = fetch.mock.calls[0];
    expect(fetchUrl).not.toContain('token=');
  });
});

// ── useClasses hook ───────────────────────────────────────────────────────────

describe('useClasses', () => {
  it('starts with loading=true and empty classes array', () => {
    mockFetch([]);
    const { result } = renderHook(() => useClasses());
    expect(result.current.loading).toBe(true);
    expect(result.current.classes).toEqual([]);
  });

  it('resolves classes and clears loading on success', async () => {
    const classes = [{ id: 1, name: '3A', points: 5 }];
    mockFetch(classes);
    const { result } = renderHook(() => useClasses());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.classes).toEqual(classes);
    expect(result.current.error).toBeNull();
  });

  it('sets error and clears loading on failure', async () => {
    mockFetch(null, { ok: false });
    const { result } = renderHook(() => useClasses());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to load classes');
    expect(result.current.classes).toEqual([]);
  });

  it('exposes a refresh callback', async () => {
    mockFetch([]);
    const { result } = renderHook(() => useClasses());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.refresh).toBe('function');
  });
});

// ── useTotal hook ─────────────────────────────────────────────────────────────

describe('useTotal', () => {
  it('loads total and clears loading', async () => {
    mockFetch({ total: 99 });
    const { result } = renderHook(() => useTotal(0)); // 0 = no polling
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.total).toBe(99);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    mockFetch(null, { ok: false });
    const { result } = renderHook(() => useTotal(0));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to load total');
  });

  it('starts with total=0', () => {
    mockFetch({ total: 5 });
    const { result } = renderHook(() => useTotal(0));
    expect(result.current.total).toBe(0);
  });
});
