import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useGames } from '../../context/GamesContext';
import { useAuth } from '../../context/AuthContext';

const GamesManagement = () => {
  const navigate = useNavigate();
  const { games: allGames, loading: gamesLoading, deleteGame } = useGames();
  const { user, isAdmin, isMod } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  // Filter games based on search and platform — respect moderator scope
  useEffect(() => {
    let filtered = allGames;

    // If the current user is a moderator (but not admin), only show their assigned games
    if (isMod && !isAdmin) {
      const moderated = (user && Array.isArray(user.moderatedGames)) ? user.moderatedGames : [];
      filtered = filtered.filter(g => moderated.includes(g.dbId));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(game => 
        game.title?.toLowerCase().includes(searchLower) ||
        game.slug?.toLowerCase().includes(searchLower)
      );
    }

    if (platformFilter) {
      filtered = filtered.filter(game => game.platform === platformFilter);
    }

    setGames(filtered);
  }, [allGames, search, platformFilter, isAdmin, isMod, user]);
  const handleDelete = async (gameId, gameTitle) => {
    if (!confirm(`Are you sure you want to delete "${gameTitle}"?`)) {
      return;
    }

    try {
      await deleteGame(gameId);
      alert('Game deleted successfully');
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
            <optgroup label="Retro">
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
            </optgroup>
            <optgroup label="Modern / Misc">
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
          {isAdmin && (
            <button onClick={() => navigate('/admin/create')} className="cta">
              Add New Game
            </button>
          )}
        </div>
      </div>

      {gamesLoading && (
        <div className="loading">Loading games...</div>
      )}

      {!loading && games.length === 0 && (
        <div className="empty-state">No games found</div>
      )}

      {!loading && games.length > 0 && (
        <div className="games-list">
          {games.map((game) => (
            <div key={game.dbId || game._id} className="game-item">
              <img
                src={game.art || game.coverImageUrl || '/assets/pokeball.png'}
                alt={game.title}
                className="game-thumb"
              />
              <div className="game-info">
                <h3>{game.title}</h3>
                <div className="game-meta">
                  <span className="chip">{game.platform}</span>
                  <span className="chip">{game.year || game.releaseYear}</span>
                  {game.versionLabel && (
                    <span className="chip">{game.versionLabel}</span>
                  )}
                  <span className="chip">{game.theme?.name || 'retro'}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--admin-muted)', margin: '4px 0 0' }}>
                  {game.description?.substring(0, 100) || ''}...
                </p>
              </div>
              <div className="game-actions">
                {((isAdmin) || (isMod && user && Array.isArray(user.moderatedGames) && user.moderatedGames.includes(game.dbId))) ? (
                  <>
                    <button
                      className="cta secondary"
                      onClick={() => navigate(`/admin/edit/${game.dbId || game._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="cta danger"
                      onClick={() => handleDelete(game.dbId || game._id, game.title)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <div style={{ color: 'var(--admin-muted)', fontSize: 13 }}>No actions</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default GamesManagement;
