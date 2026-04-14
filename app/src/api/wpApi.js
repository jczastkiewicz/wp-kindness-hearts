/**
 * WP REST API client for Kindness Hearts.
 *
 * All functions read the base URL and nonce from window.WP_CONFIG
 * which is injected by WordPress (class-frontend.php).
 */

function getConfig() {
  return window.WP_CONFIG || {
    restUrl: '/wp-json/kindness/v1',
    nonce:   '',
  };
}

function headers(token = null) {
  const h = { 'Content-Type': 'application/json' };
  const { nonce } = getConfig();
  if (nonce) h['X-WP-Nonce'] = nonce;
  if (token) h['X-KH-Token'] = token;
  return h;
}

function url(path) {
  return getConfig().restUrl + path;
}

// ── Classes ──────────────────────────────────────────────────────────────────

/** @returns {Promise<Array<{id:number, name:string, points:number}>>} */
export async function fetchClasses() {
  const res = await fetch(url('/classes'));
  if (!res.ok) throw new Error('Failed to load classes');
  return res.json();
}

// ── Points ───────────────────────────────────────────────────────────────────

/**
 * Add one kindness point to a class.
 * @param {number} classId
 * @param {string} token   – secret token from the QR code URL
 * @returns {Promise<{class_id:number, class_points:number, total_points:number}>}
 */
export async function addPoint(classId, token) {
  const res = await fetch(url('/points?token=' + encodeURIComponent(token)), {
    method:  'POST',
    headers: headers(token),
    body:    JSON.stringify({ class_id: classId }),
  });
  if (res.status === 403) throw new Error('Invalid token. Please rescan the QR code.');
  if (!res.ok)            throw new Error('Failed to add point');
  return res.json();
}

// ── Total ─────────────────────────────────────────────────────────────────────

/** @returns {Promise<number>} school-wide total */
export async function fetchTotal() {
  const res = await fetch(url('/total'));
  if (!res.ok) throw new Error('Failed to load total');
  const data = await res.json();
  return data.total;
}

// ── React hooks (lightweight, no external library needed) ─────────────────────

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook: load classes and provide a refresh function.
 * Returns { classes, loading, error, refresh }
 */
export function useClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClasses(await fetchClasses());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { classes, loading, error, refresh };
}

/**
 * Hook: load & periodically poll school-wide total.
 * Returns { total, loading, error, refresh }
 */
export function useTotal(pollIntervalMs = 10_000) {
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    try {
      setTotal(await fetchTotal());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!pollIntervalMs) return;
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [refresh, pollIntervalMs]);

  return { total, loading, error, refresh };
}
