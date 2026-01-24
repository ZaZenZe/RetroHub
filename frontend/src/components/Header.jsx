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
    { to: '/', label: 'HOME' },
    { to: '/profile', label: 'PROFILE' },
    { to: '/settings', label: 'SETTINGS' },
    { to: '/about', label: 'ABOUT' },
  ];

  // Random pixel GIF logic for logo (ported from legacy script)
  const [logoSrc, setLogoSrc] = useState('/assets/pokeball.png');
  const pixelGifs = [
    '/assets/pixel/12c6a260613c6e51b16af016dd38c44e182fcd68_hq.gif',
    '/assets/pixel/36541a1369a2eec1894ebff1b9e4a948a78cea80_hq.gif',
    '/assets/pixel/3c06599306cca1e170ce8df10949cf91.gif',
    '/assets/pixel/4efee18cb06f3d2f8456a40d1e0460e7.gif',
    '/assets/pixel/6e7ebe7e86da8cb09f07c765f73efb29b8c0a97d_hq.gif',
    '/assets/pixel/6Vww.gif',
    '/assets/pixel/b695b53cae18d460881f51b037977b5b1cc261e9_hq.gif',
    '/assets/pixel/bdb1f2848d8546d50e82c4ffd43b786f.gif',
    '/assets/pixel/c740eb46064c338fc67c219b3df8792c0719ac38_hq.gif',
    '/assets/pixel/e938d18fc07a3ffd16b4864ef2f1308f.gif',
  ];

  const handleLogoInteract = (active) => {
    if (!active) {
      setLogoSrc('/assets/pokeball.png');
      return;
    }
    const idx = Math.floor(Math.random() * pixelGifs.length);
    setLogoSrc(pixelGifs[idx]);
  };

  return (
    <header className="app-header hud-header" role="banner">
      <div className="hud-wrap">
        <Link 
          to="/" 
          className="brand"
          onMouseEnter={() => handleLogoInteract(true)}
          onMouseLeave={() => handleLogoInteract(false)}
        >
          <img 
            src={logoSrc} 
            alt="Retro Hub icon" 
            className="brand-icon-img"
            style={{ width: '34px', height: '34px', objectFit: 'contain', imageRendering: 'pixelated' }}
          />
          <div className="titles">
            <h1>
              RETRO<span>HUB</span>
            </h1>
            <p className="subtitle">EXPLORE • DISCUSS • PLAY</p>
          </div>
        </Link>
        
        <div className="hud-right" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: 'auto' }}>
          {user && (
            <div id="auth-chip" className="chip auth-chip-inline">
              Hey, {user.name || user.email.split('@')[0]}
            </div>
          )}

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
        </div>

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
