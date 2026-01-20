import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ onAuthClick }) => {
  const { user, isAdmin, isMod, logout } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [headerGif, setHeaderGif] = useState('assets/pokeball.png');
  const location = useLocation();

  const pixelGifs = [
    'assets/pixel/12c6a260613c6e51b16af016dd38c44e182fcd68_hq.gif',
    'assets/pixel/36541a1369a2eec1894ebff1b9e4a948a78cea80_hq.gif',
    'assets/pixel/3c06599306cca1e170ce8df10949cf91.gif',
    'assets/pixel/4efee18cb06f3d2f8456a40d1e0460e7.gif',
    'assets/pixel/6e7ebe7e86da8cb09f07c765f73efb29b8c0a97d_hq.gif',
    'assets/pixel/6Vww.gif',
    'assets/pixel/b695b53cae18d460881f51b037977b5b1cc261e9_hq.gif',
    'assets/pixel/bdb1f2848d8546d50e82c4ffd43b786f.gif',
    'assets/pixel/c740eb46064c338fc67c219b3df8792c0719ac38_hq.gif',
    'assets/pixel/e938d18fc07a3ffd16b4864ef2f1308f.gif',
  ];

  useEffect(() => {
    // Show random pixel GIF on inner pages
    if (location.pathname !== '/') {
      const randomIndex = Math.floor(Math.random() * pixelGifs.length);
      setHeaderGif(pixelGifs[randomIndex]);
    } else {
      setHeaderGif('assets/pokeball.png');
    }
  }, [location.pathname]);

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

  return (
    <header className="app-header" role="banner">
      <div className="brand">
        <img 
          className="logo logo-home" 
          src={headerGif} 
          alt="Retro Hub icon" 
          width="44" 
          height="44"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="titles">
          <h1>Retro Hub</h1>
          <p className="subtitle">Explore • Discuss • Get tips on beloved classics</p>
        </div>
      </div>
      <nav className="main-nav" aria-label="Primary">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/profile" className="nav-link">Profile</Link>
        {(isAdmin || isMod) && (
          <Link to="/admin" className="nav-link">
            {isAdmin ? 'Admin' : 'Moderator'}
          </Link>
        )}
        <Link to="/settings" className="nav-link">Settings</Link>
        <Link to="/about" className="nav-link">About</Link>
        <button 
          id="auth-btn" 
          className="nav-link" 
          type="button"
          onClick={handleAuthClick}
        >
          {user ? 'Signout' : 'Sign in'}
        </button>
        {user && (
          <span id="auth-chip" className="chip">
            Hey, {user.name || user.email}
          </span>
        )}
      </nav>
      <button 
        className="menu-toggle" 
        aria-label="Toggle navigation"
        onClick={() => setIsNavOpen(!isNavOpen)}
      >
        <span className="material-symbols-outlined">menu</span>
        <span className="material-symbols-outlined">close</span>
      </button>
      <div 
        className="nav-backdrop" 
        aria-hidden="true"
        onClick={() => setIsNavOpen(false)}
      />
    </header>
  );
};

export default Header;
