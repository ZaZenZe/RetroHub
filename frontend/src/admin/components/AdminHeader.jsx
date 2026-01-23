import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminHeader = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const panelTitle = isAdmin ? 'Admin Panel' : 'Mod Panel';
  const panelSubtitle = isAdmin
    ? 'Manage games, content, and moderators'
    : 'Manage games and content';

  return (
    <header className="admin-header">
      <div className="brand">
        <img className="logo" src="/assets/pokeball.png" alt="Retro Hub" width="32" height="32" />
        <div className="titles">
          <h1 id="panel-title">{panelTitle}</h1>
          <p className="subtitle" id="panel-subtitle">{panelSubtitle}</p>
        </div>
      </div>
      <nav className="admin-nav">
        <button
          className="nav-btn active"
          onClick={() => navigate('/admin/games')}
        >
          <span className="material-symbols-outlined">games</span>
          Games
        </button>
        <button
          className="nav-btn"
          onClick={() => navigate('/admin/create')}
        >
          <span className="material-symbols-outlined">add_circle</span>
          Create Game
        </button>
      </nav>
      <div className="admin-user">
        <span id="admin-username">{user?.name || user?.email || 'Admin'}</span>
        <button className="cta secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
