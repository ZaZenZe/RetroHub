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
    year: '',
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
      const yearMatch = filters.year ? (g.year || '').toString() === filters.year : true;
      const text = `${g.title || ''} ${g.platform || ''} ${g.version || ''}`.toLowerCase();
      const searchMatch = filters.search ? text.includes(filters.search.toLowerCase()) : true;
      return platformMatch && yearMatch && searchMatch;
    });
  };

  const filteredGames = filterGameList(games);

  const handleReset = () => {
    setFilters({ platform: '', year: '', search: '' });
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
    <section id="home-view" className="view active" aria-labelledby="home-title">
      <div className="hero">
        <h2 id="home-title">Featured Retro Games</h2>
        <p>Browse the library. Open a game to see info, community notes, and chat with the built-in guide.</p>
      </div>
      
      <div className="filters" aria-label="Game filters">
        <div className="filter-group">
          <label htmlFor="filter-platform">Platform</label>
          <select
            id="filter-platform"
            value={filters.platform}
            onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
          >
            <option value="">All</option>
            <option value="GBA">GBA</option>
            <option value="DS">DS</option>
            <option value="3DS">3DS</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-year">Release</label>
          <select
            id="filter-year"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">Any</option>
            <option value="2004">2004</option>
            <option value="2005">2005</option>
            <option value="2008">2008</option>
            <option value="2009">2009</option>
            <option value="2012">2012</option>
            <option value="2013">2013</option>
          </select>
        </div>
        <div className="filter-group search">
          <label htmlFor="filter-search">Search</label>
          <input
            id="filter-search"
            type="search"
            placeholder="Search by title, region, or platform"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="filter-actions">
          <button id="filter-reset" className="cta secondary" type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

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
        <div id="home-empty" className="empty-state" role="status" aria-live="polite">
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
                className="card"
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
                  className="thumb"
                  style={{ backgroundImage: displayImage ? `url('${displayImage}')` : '' }}
                />
                <div className="body">
                  <div className="title">{game.title}</div>
                  <div className="chips">
                    <span className={`chip chip-platform ${platformClass}`}>{game.platform}</span>
                    <span className="chip">{game.year || 'TBA'}</span>
                  </div>
                  <button className="cta" onClick={() => handleCardClick(game)}>
                    Open
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Home;
