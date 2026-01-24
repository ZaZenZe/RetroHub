import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGames } from '../context/GamesContext';
import { useTheme } from '../context/ThemeContext';

const Home = () => {
  const { games, loading } = useGames();
  const { clearTheme } = useTheme();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    platform: '',
    minYear: '', 
    maxYear: '',
    search: '',
  });
  const [hoveredGame, setHoveredGame] = useState(null);

  useEffect(() => {
    clearTheme();
    document.body.classList.add('theme-home');
    return () => document.body.classList.remove('theme-home');
  }, []);

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
      <div className="home-hero tech-card">
        <h2 id="home-title" className="glitch-text">WELCOME TO RETRO_HUB</h2>
        <p className="hero-copy">
          Browse the database. Open a game to view intel, community notes, and summon the AI guide.
        </p>
        <div className="hero-terminal" aria-hidden="true">
          <span>INITIALIZING DATABASE... CONNECTED.</span>
        </div>
      </div>

      <div className="home-layout">
        <aside className="filters tech-card" aria-label="Game filters">
          <div className="panel-title">SEARCH_PARAMS</div>
          <div className="filter-group">
            <label htmlFor="filter-platform">Platform</label>
            <select
              id="filter-platform"
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
            >
              <option value="">All Systems</option>
              <optgroup label="Nintendo">
                <option value="NES">NES</option>
                <option value="SNES">SNES</option>
                <option value="GB">GB</option>
                <option value="GBC">GBC</option>
                <option value="GBA">GBA</option>
                <option value="N64">N64</option>
                <option value="GC">GameCube</option>
                <option value="DS">DS</option>
                <option value="3DS">3DS</option>
                <option value="Wii">Wii</option>
                <option value="Switch">Switch</option>
              </optgroup>
              <optgroup label="PlayStation">
                <option value="PS1">PS1</option>
                <option value="PS2">PS2</option>
                <option value="PSP">PSP</option>
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
              {filteredGames.map((game) => {
                const isHovered = hoveredGame === game.id;
                const displayImage = isHovered && game.hover ? game.hover : game.art;
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
                    <div
                      className="thumb crt-screen"
                      style={{ backgroundImage: displayImage ? `url('${displayImage}')` : '' }}
                    />
                    <div className="body">
                      <div className="title">{game.title}</div>
                      <div className="chips">
                        <span className={`chip chip-platform ${platformClass}`}>{game.platform}</span>
                        <span className="chip">{game.year || 'TBA'}</span>
                      </div>
                      <button className="btn-cyber" onClick={() => handleCardClick(game)}>
                        OPEN
                      </button>
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
