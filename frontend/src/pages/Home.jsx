import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGames } from '../context/GamesContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import banner2 from '../../assets/AP_Steam_Banner_2.gif';
import banner3 from '../../assets/AP_Steam_Banner_3.gif';
import banner4 from '../../assets/AP_Steam_Banner_4.gif';

const Home = () => {
  const { games, loading } = useGames();
  const { clearTheme } = useTheme();
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    platform: '',
    minYear: '', 
    maxYear: '',
    search: '',
  });
  const [hoveredGame, setHoveredGame] = useState(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'time'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  const bannerImages = [
    banner2,
    banner3,
    banner4,
  ];

  useEffect(() => {
    clearTheme();
    document.body.classList.add('theme-home');
    return () => document.body.classList.remove('theme-home');
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 4000); // Change banner every 4 seconds

    return () => clearInterval(interval);
  }, [bannerImages.length]);

  const filterGameList = (gamesList) => {
    return gamesList.filter((g) => {
      const platformMatch = filters.platform
        ? (g.platform || '').toLowerCase().includes(filters.platform.toLowerCase())
        : true;
      
      const gYear = parseInt(g.year || g.releaseYear || 0, 10);
      let yearMatch = true;

      // Min/Max Year Range Logic
      if (filters.minYear) {
        if (!gYear || gYear < parseInt(filters.minYear, 10)) yearMatch = false;
      }
      if (yearMatch && filters.maxYear) {
        if (!gYear || gYear > parseInt(filters.maxYear, 10)) yearMatch = false;
      }

      const searchTerms = filters.search.toLowerCase().trim();
      let searchMatch = true;
      if (searchTerms) {
        // Broad search across multiple fields
        const text = [
          g.title,
          g.platform,
          g.year || g.releaseYear,
          g.region || g.version || '',
          g.developer,
          g.publisher
        ].filter(Boolean).join(' ').toLowerCase();
        searchMatch = text.includes(searchTerms);
      }
      
      return platformMatch && yearMatch && searchMatch;
    });
  };

  const filteredGames = filterGameList(games);

  const sortedGames = (() => {
    if (!Array.isArray(filteredGames)) return filteredGames;
    const copy = [...filteredGames];
    copy.sort((a, b) => {
      if (sortBy === 'name') {
        const an = (a.title || '').toLowerCase();
        const bn = (b.title || '').toLowerCase();
        if (an < bn) return sortOrder === 'asc' ? -1 : 1;
        if (an > bn) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
      // sortBy === 'time' -> use year/releaseYear
      const ay = parseInt(a.year || a.releaseYear || 0, 10) || 0;
      const by = parseInt(b.year || b.releaseYear || 0, 10) || 0;
      if (ay < by) return sortOrder === 'asc' ? -1 : 1;
      if (ay > by) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  })();

  const handleReset = () => {
    setFilters({ platform: '', minYear: '', maxYear: '', search: '' });
  };

  const getPlatformClass = (platform) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('3ds')) return 'threeds';
    if (p.includes('gba')) return 'gba';
    if (p.includes('ds')) return 'ds';
    return '';
  };

  const handleCardClick = (game) => {
    navigate(`/game/${game.slug || game.id}`);
  };

  return (
    <section id="home-view" className="view active home-view" aria-labelledby="home-title">
      <div 
        className="home-hero tech-card"
        style={{
          backgroundImage: `url(${bannerImages[currentBanner]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 0.5s ease-in-out',
          position: 'relative',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '30px 15px'
        }}
      >
        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1
        }} />
        
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '100%', overflow: 'hidden' }}>
          <h2 id="home-title" className="glitch-text" style={{ marginBottom: '10px', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', lineHeight: '1.1' }}>WELCOME TO RETRO_HUB</h2>
          <p className="hero-copy" style={{ marginBottom: '10px', fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', lineHeight: '1.4' }}>
            Browse the database. Open a game to view intel, community notes, and summon the AI guide.
          </p>
          <div className="hero-terminal" aria-hidden="true" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.9rem)' }}>
            <span>INITIALIZING DATABASE... CONNECTED.</span>
          </div>
        </div>
      </div>

      <div className="home-layout">
        <aside className="filters tech-card" aria-label="Game filters">
          <div className="panel-title">SEARCH_PARAMS</div>

          {/* Sort controls: moved to top of filters so they're always visible */}
          <div className="filter-group" style={{ marginTop: 12 }}>
            <label htmlFor="filter-sort">Sort by</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select id="filter-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: 1, minWidth: 120, padding: '10px' }}>
                <option value="name">Name</option>
                <option value="time">Release Date</option>
              </select>

              <select id="filter-sort-order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ flex: 1, minWidth: 120, padding: '10px' }}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-platform">Platform</label>
            <select
              id="filter-platform"
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
            >
                <option value="">All Systems</option>
                <optgroup label="Retro Systems">
                  <option value="Atari">Atari</option>
                  <option value="Amiga">Amiga</option>
                  <option value="NES">NES</option>
                  <option value="SNES">SNES</option>
                  <option value="GB">GB</option>
                  <option value="GBC">GBC</option>
                  <option value="GBA">GBA</option>
                  <option value="N64">N64</option>
                  <option value="GC">GameCube</option>
                  <option value="Dreamcast">Dreamcast</option>
                  <option value="Sega Genesis">Sega Genesis</option>
                  <option value="Sega Master System">Sega Master System</option>
                  <option value="Sega Saturn">Sega Saturn</option>
                  <option value="DS">DS</option>
                  <option value="3DS">3DS</option>
                  <option value="Wii">Wii</option>
                  <option value="PS1">PS1</option>
                  <option value="PS2">PS2</option>
                  <option value="PSP">PSP</option>
                  <option value="Arcade">Arcade</option>
                  <option value="PC">PC</option>
                  <option value="Other">Other</option>
                </optgroup>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Release Year Range</label>
            <div className="year-range-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="number"
                placeholder="From"
                min="1980"
                max={new Date().getFullYear()}
                value={filters.minYear}
                onChange={(e) => setFilters({ ...filters, minYear: e.target.value })}
                aria-label="Minimum Year"
              />
              <input
                type="number"
                placeholder="To"
                min="1980"
                max={new Date().getFullYear()}
                value={filters.maxYear}
                onChange={(e) => setFilters({ ...filters, maxYear: e.target.value })}
                aria-label="Maximum Year"
              />
            </div>
          </div>

          <div className="filter-group search">
            <label htmlFor="filter-search">Search</label>
            <input
              id="filter-search"
              type="search"
              placeholder="Title, region, or keyword..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="filter-actions">
            <button id="filter-reset" className="btn-cyber" type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
          <div className="filter-status">
            <span>DB_SIZE:</span>
            <span>42TB</span>
          </div>
          <div className="filter-bar" aria-hidden="true" />
        </aside>

        <div className="home-main">
          {loading && (
            <div id="home-loading" className="loading-grid" aria-hidden="false">
              <div className="skeleton card"></div>
              <div className="skeleton card"></div>
              <div className="skeleton card"></div>
              <div className="skeleton card"></div>
              <div className="skeleton card"></div>
              <div className="skeleton card"></div>
            </div>
          )}

          {!loading && filteredGames.length === 0 && (
            <div id="home-empty" className="empty-state tech-card" role="status" aria-live="polite">
              <p>No games match your filters. Clear filters or try another keyword.</p>
            </div>
          )}

          {!loading && filteredGames.length > 0 && (
            <div id="game-grid" className="game-grid" role="list">
              {sortedGames.map((game) => {
                const isHovered = hoveredGame === game.id;
                const displayImage = isHovered
                  ? game.hoverGif || game.hover || game.art
                  : game.art;
                const platformClass = getPlatformClass(game.platform);

                return (
                  <article
                    key={game.id}
                    className="card tech-card"
                    role="listitem"
                    tabIndex={0}
                    onMouseEnter={() => setHoveredGame(game.id)}
                    onMouseLeave={() => setHoveredGame(null)}
                    onFocus={() => setHoveredGame(game.id)}
                    onBlur={() => setHoveredGame(null)}
                    onClick={() => handleCardClick(game)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(game);
                      }
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div
                        className="thumb crt-screen"
                        style={{ backgroundImage: displayImage ? `url('${displayImage}')` : '' }}
                      />

                    </div>

                    <div className="body">
                      <div className="title">{game.title}</div>
                      <div className="chips">
                        <span className={`chip chip-platform ${platformClass}`}>{game.platform}</span>
                        <span className="chip">{game.year || 'TBA'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn-cyber" onClick={() => handleCardClick(game)}>
                          OPEN
                        </button>

                        <button
                          type="button"
                          className={`btn-icon fav-btn ${Array.isArray(user?.favoriteGames) && user.favoriteGames.includes(game.dbId) ? 'fav' : ''}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!user) return alert('Sign in to favourite games');
                            const gid = game.dbId || game._id || game.id;
                            const prev = user.favoriteGames || [];
                            const currently = Array.isArray(prev) && prev.includes(gid);
                            const nextFavs = currently ? prev.filter(x => x !== gid) : [...prev, gid];
                            updateUserData({ favoriteGames: nextFavs });
                            try {
                              const res = await api.toggleFavoriteGame(user.id, gid, currently ? 'remove' : 'add');
                              if (res && res.user) updateUserData(res.user);
                            } catch (err) {
                              console.error('Failed to toggle favorite from catalog', err);
                              updateUserData({ favoriteGames: prev });
                              alert('Failed to update favourites');
                            }
                          }}
                          aria-pressed={Array.isArray(user?.favoriteGames) && user.favoriteGames.includes(game.dbId)}
                          title={Array.isArray(user?.favoriteGames) && user.favoriteGames.includes(game.dbId) ? 'Unfavorite' : 'Add to favourites'}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <span className="material-symbols-sharp" aria-hidden="true">favorite</span>
                          <span className="sr-only">{Array.isArray(user?.favoriteGames) && user.favoriteGames.includes(game.dbId) ? 'Unfavorite' : 'Add to favourites'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Home;
