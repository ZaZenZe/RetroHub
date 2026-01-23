import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ onAuthClick }) => {
  const { user, isAdmin, isMod, logout } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Close nav when route changes
    setIsNavOpen(false);
  }, [location]);

  useEffect(() => {
    if (isNavOpen) {
      document.body.classList.add('nav-open');
    } else {
      document.body.classList.remove('nav-open');
    }
    return () => document.body.classList.remove('nav-open');
  }, [isNavOpen]);

  const handleAuthClick = () => {
    if (user) {
      logout();
    } else {
      onAuthClick();
    }
  };

  const navItems = [
    { to: '/', label: 'DATABASE' },
    { to: '/profile', label: 'USER_LOGS' },
    { to: '/settings', label: 'CONFIG' },
    { to: '/about', label: 'ABOUT' },
  ];

  return (
    <header className="app-header hud-header" role="banner">
      <div className="hud-wrap">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <span className="material-symbols-sharp">terminal</span>
          </span>
          <div className="titles">
            <h1>
              RETRO<span>HUB</span>
            </h1>
            <p className="subtitle">SYS.VER.3.0</p>
          </div>
        </Link>

        <nav className="main-nav" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          {(isAdmin || isMod) && (
            <Link to="/admin" className="nav-item">
              {isAdmin ? 'ADMIN' : 'MOD_PANEL'}
            </Link>
          )}
          <button className="nav-item" type="button" onClick={handleAuthClick}>
            {user ? 'SIGNOUT' : 'SIGNIN'}
          </button>
        </nav>

        <div className="hud-status">
          <span className="label">NET_STATUS</span>
          <span className="value">ONLINE</span>
        </div>

        <button
          className="menu-toggle"
          aria-label="Toggle navigation"
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          <span className="material-symbols-sharp">menu</span>
          <span className="material-symbols-sharp">close</span>
        </button>
      </div>

      <div className={`mobile-menu ${isNavOpen ? 'show' : ''}`} role="dialog" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="mobile-nav-item"
            onClick={() => setIsNavOpen(false)}
          >
            >> {item.label}
          </Link>
        ))}
        {(isAdmin || isMod) && (
          <Link to="/admin" className="mobile-nav-item" onClick={() => setIsNavOpen(false)}>
            >> {isAdmin ? 'ADMIN' : 'MOD_PANEL'}
          </Link>
        )}
        <button className="mobile-nav-item" type="button" onClick={handleAuthClick}>
          >> {user ? 'SIGNOUT' : 'SIGNIN'}
        </button>
        {user && <span className="user-tag">ID: {user.username || user.email}</span>}
      </div>
      <div className="nav-backdrop" aria-hidden="true" onClick={() => setIsNavOpen(false)} />
    </header>
  );
};

export default Header;
