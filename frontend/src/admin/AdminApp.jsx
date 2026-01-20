import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminHeader from './components/AdminHeader';
import GamesManagement from './pages/GamesManagement';
import GameForm from './pages/GameForm';
import '../../style.css';
import '../../admin.css';

const AdminRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user || (user.role !== 'admin' && user.role !== 'mod')) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <AdminHeader />
      <main className="admin-main">
        <Routes>
          <Route index element={<GamesManagement />} />
          <Route path="games" element={<GamesManagement />} />
          <Route path="create" element={<GameForm />} />
          <Route path="edit/:gameId" element={<GameForm />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </>
  );
};

function AdminApp() {
  useEffect(() => {
    document.body.classList.add('theme-admin');
    return () => document.body.classList.remove('theme-admin');
  }, []);

  return (
    <div className="admin-app">
      <AdminRoutes />
    </div>
  );
}

export default AdminApp;
