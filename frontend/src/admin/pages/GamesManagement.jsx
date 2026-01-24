import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const GamesManagement = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  useEffect(() => {
    loadGames();
  }, [search, platformFilter]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (platformFilter) params.append('platform', platformFilter);
      params.append('limit', '100');

        const data = await api.request(`/admin/games?${params.toString()}`);
      setGames(data.games || []);
    } catch (error) {
      console.error('Failed to load games:', error);
      alert('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gameId, gameTitle) => {
    if (!confirm(`Are you sure you want to delete "${gameTitle}"?`)) {
      return;
    }

    try {
      await api.deleteGame(gameId);
      alert('Game deleted successfully');
      loadGames();
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert('Failed to delete game');
    }
  };

  return (
    <section id="games-view" className="admin-view active">
      <div className="view-header">
        <h2>Manage Games</h2>
        <div className="filters">
          <input
            type="search"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="">All Platforms</option>
            <option value="NES">NES</option>
            <option value="SNES">SNES</option>
            <option value="GB">GB</option>
            <option value="GBC">GBC</option>
            <option value="N64">N64</option>
            <option value="GBA">GBA</option>
            <option value="GC">GameCube</option>
            <option value="DS">DS</option>
            <option value="Wii">Wii</option>
            <option value="3DS">3DS</option>
            <option value="Switch">Switch</option>
            <option value="PlayStation">PlayStation</option>
            <option value="PS1">PS1</option>
            <option value="PlayStation 2">PlayStation 2</option>
            <option value="PS2">PS2</option>
            <option value="PSP">PSP</option>
            <option value="Sega Genesis">Sega Genesis</option>
            <option value="Arcade">Arcade</option>
            <option value="PC">PC</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading">Loading games...</div>
      )}

      {!loading && games.length === 0 && (
        <div className="empty-state">No games found</div>
      )}

      {!loading && games.length > 0 && (
        <div className="games-list">
          {games.map((game) => (
            <div key={game._id} className="game-item">
              <img
                src={game.coverImageUrl || '/assets/pokeball.png'}
                alt={game.title}
                className="game-thumb"
              />
              <div className="game-info">
                <h3>{game.title}</h3>
                <div className="game-meta">
                  <span className="chip">{game.platform}</span>
                  <span className="chip">{game.releaseYear}</span>
                  {game.versionLabel && (
                    <span className="chip">{game.versionLabel}</span>
                  )}
                  <span className="chip">{game.theme?.name || 'retro'}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--admin-muted)', margin: '4px 0 0' }}>
                  {game.description.substring(0, 100)}...
                </p>
              </div>
              <div className="game-actions">
                <button
                  className="cta secondary"
                  onClick={() => navigate(`/admin/edit/${game._id}`)}
                >
                  Edit
                </button>
                <button
                  className="cta danger"
                  onClick={() => handleDelete(game._id, game.title)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default GamesManagement;
