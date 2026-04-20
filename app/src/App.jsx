import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeacherPage from './pages/TeacherPage.jsx';
import HeartPage from './pages/HeartPage.jsx';

/**
 * App uses hash-based routing so it works on any server path.
 *
 * Routes:
 *   /#/teacher?token=SECRET  →  Teacher panel (token required)
 *   /#/heart                 →  Public heart visualization display
 *   /                        →  Redirect based on query param
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/heart" element={<HeartPage />} />
        {/* Default: check if token is in search params */}
        <Route path="/" element={<DefaultRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

function DefaultRedirect() {
  // If a token is provided in the outer query string (e.g. ?token=...), forward
  // it into the hash-based teacher route so the app boots with the token.
  // This covers cases where a link rewriter or platform strips the '#' fragment.
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      return <Navigate to={'/teacher?token=' + encodeURIComponent(token)} replace />;
    }
  } catch {
    // ignore and fall back to heart
  }
  return <Navigate to="/heart" replace />;
}
