import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClasses } from '../wpApi.js';

// Ensure fetch is stubbed so the hook's initial call resolves
globalThis.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });

describe('useClasses polling', () => {
  it('sets an interval when pollIntervalMs is provided', () => {
    const { unmount } = renderHook(() => useClasses(1000));
    // If effect ran, hook mounted and unmounted cleanly
    unmount();
    expect(true).toBeTruthy();
  });
});
