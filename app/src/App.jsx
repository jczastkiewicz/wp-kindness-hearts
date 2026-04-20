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
  // The QR code URL format: /kindness-app/#/teacher?token=...
  // But if someone lands on just /kindness-app/ send them to the heart display
  return <Navigate to="/heart" replace />;
}
