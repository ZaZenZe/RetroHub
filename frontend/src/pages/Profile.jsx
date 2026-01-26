import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGames } from '../context/GamesContext';
import api from '../services/api';
import PageTracker from '../components/PageTracker';

const Profile = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUserData, userStats, refreshUserStats } = useAuth();
  const { games } = useGames();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [userGames, setUserGames] = useState([]);
  const [collectionFilter, setCollectionFilter] = useState('');
  const [lastPosts, setLastPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredDetails, setFeaturedDetails] = useState([]);
  const [manualRaGameId, setManualRaGameId] = useState('');
  const [manualAchievements, setManualAchievements] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');
  const [selectedAchievements, setSelectedAchievements] = useState(new Set());
  const [savingAchievements, setSavingAchievements] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [statsRes, achRes, gamesRes, postsRes, raRes] = await Promise.all([
          api.getUserStats(user?.id),
          api.getUserAchievements(user?.id),
          api.getUserGames(user?.id),
          api.getLastPosts(user?.id),
          api.getRetroAchievementsAwards(user?.id, user?.username).catch(() => null),
        ]);

        setStats(statsRes?.stats || null);
        const raAchievements = raRes?.achievements || [];
        const loadedAchievements = raAchievements.length ? raAchievements : (achRes?.achievements || []);
        setAchievements(loadedAchievements);
        setLastPosts(postsRes?.posts || []);

        // if stats appear lower than the returned posts, reconcile locally so UI isn't misleading
        if (postsRes?.posts && postsRes.posts.length > (statsRes?.stats?.forumPosts || 0)) {
          setStats(s => ({ ...(s || {}), forumPosts: postsRes.posts.length }));
        }
        
        // Merge user games with game catalog
        const userGamesList = gamesRes?.games || [];
        const collection = buildCollection(userGamesList);
        setUserGames(collection);

        // ensure the profile page tracker has the latest authoritative stats (so it shows immediately)
        if (typeof refreshUserStats === 'function') await refreshUserStats();

        // If AuthContext provided favorite games, enrich them from catalog (preferred over calling /users/:id)
        if (user && Array.isArray(user.favoriteGames)) {
          const favs = user.favoriteGames
            .map(fid => games.find(g => g.dbId === fid || g.id === fid))
            .filter(Boolean);
          if (favs.length) setUserGames(prev => {
            const ids = new Set(prev.map(p => p.dbId || p.id));
            return [...favs.filter(f=>!(ids.has(f.dbId||f.id))), ...prev];
          });
        }

        // Initialize selected achievements from user profile
        if (user && Array.isArray(user.featuredAchievements)) {
          setSelectedAchievements(new Set(user.featuredAchievements.map(String)));
        } else {
          setSelectedAchievements(new Set());
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [isAuthenticated, user?.id, games]);

  useEffect(() => {
    if (user && Array.isArray(user.featuredAchievements)) {
      setSelectedAchievements(new Set(user.featuredAchievements.map(String)));
    }
  }, [user?.featuredAchievements]);

  useEffect(() => {
    const loadFeaturedDetails = async () => {
      if (!user || !Array.isArray(user.featuredAchievements) || user.featuredAchievements.length === 0) {
        setFeaturedDetails([]);
        return;
      }

      const ids = user.featuredAchievements.map(String);
      const raIds = ids.filter((id) => id.startsWith('ra|'));
      if (raIds.length === 0) {
        setFeaturedDetails([]);
        return;
      }

      const gameIds = Array.from(new Set(raIds.map((id) => id.split('|')[1]).filter(Boolean)));
      const results = await Promise.all(
        gameIds.map((gid) => api.getRetroAchievementsByRaGameId(gid).catch(() => null))
      );
      const allAchievements = results.flatMap((r) => r?.achievements || []);
      const byId = new Map(allAchievements.map((a) => [String(a._id), a]));
      setFeaturedDetails(ids.map((id) => byId.get(id)).filter(Boolean));
    };

    loadFeaturedDetails();
  }, [user?.featuredAchievements]);

  // Subscribe to live stats published by AuthContext (updated by heartbeat)
  useEffect(() => {
    if (userStats) {
      setStats(prev => ({ ...(prev || {}), ...(userStats || {}) }));
    }
  }, [userStats]);

  const buildCollection = (userGamesList) => {
    if (!Array.isArray(userGamesList) || userGamesList.length === 0) {
      return [];
    }

    return userGamesList.map((entry) => {
      const game = entry.gameId || entry.game || {};
      const catalogMatch = games.find((g) => g.dbId === game._id || g.id === game.slug) || {};
      return {
        ...catalogMatch,
        id: catalogMatch.id || game.slug || game._id,
        dbId: catalogMatch.dbId || game._id,
        title: catalogMatch.title || game.title || '',
        platform: catalogMatch.platform || game.platform || '',
        year: catalogMatch.year || game.releaseYear || '',
        art: catalogMatch.art || game.coverImageUrl || game.media?.coverImage || '',
        status: entry.status || 'BACKLOG',
        progress: entry.progressPercentage || 0,
      };
    });
  };

  const filteredGames = userGames.filter((item) =>
    collectionFilter
      ? (item.platform || '').toLowerCase().includes(collectionFilter.toLowerCase())
      : true
  );

  // Helper: render favourite game block outside of inline JSX to avoid complex template literals
  const renderFavouriteGame = () => {
    const fid = user.favoriteGames[0];
    const match = games.find(g => g.dbId === fid || g.id === fid) || null;
    if (!match) return <div className="map-hint">Favourite game not in catalog.</div>;

    return (
      <div className="fav-game" onClick={() => match && (window.location.href = `/game/${match.id}`)}>
        <div className="fav-art" style={{ backgroundImage: `url('${match.art || ''}')` }} />
        <div className="fav-meta">
          <div className="fav-title">{match.title}</div>
          <div className="fav-actions">
            <button
              className={`btn-icon ${user.favoriteGames.includes(match.dbId) ? 'fav' : ''}`}
              onClick={async (e) => {
                e.stopPropagation();
                const prev = user.favoriteGames || [];
                updateUserData({ favoriteGames: prev.filter(x => x !== match.dbId) });
                try {
                  const res = await api.toggleFavoriteGame(user.id, match.dbId, 'remove');
                  if (res && res.user) updateUserData(res.user);
                } catch (err) {
                  updateUserData({ favoriteGames: prev });
                  alert('Failed to update favourites');
                }
              }}
              aria-label="Unfavorite"
            >
              <span className="material-symbols-sharp">favorite</span>
            </button>

            <button className="btn-cyber" onClick={() => match && (window.location.href = `/game/${match.id}`)}>Open</button>
          </div>
        </div>
      </div>
    );
  };

  // Format play time (prefer exact seconds if provided, otherwise accept backend's decimal hours)
  const formatPlayTime = (raw) => {
    if (raw == null) return '0.00';
    let hours = 0;
    if (Number.isFinite(raw)) {
      // If raw looks like seconds (>= 60) assume seconds, otherwise treat as hours
      hours = raw >= 60 ? raw / 3600 : raw;
    } else {
      return '0.00';
    }

    // Sanity: clamp absurd values for display (prevent runaway numbers from bad writes)
    const maxReasonableHours = 24 * 365 * 10; // 10 years
    if (hours > maxReasonableHours) return '—';

    if (hours < 0) hours = 0;
    return hours.toFixed(2);
  };

  const toggleAchievementSelection = (id) => {
    setSelectedAchievements((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 6) {
          alert('You can showcase up to 6 achievements.');
          return next;
        }
        next.add(id);
      }
      return next;
    });
  };

  const fetchManualAchievements = async () => {
    if (!manualRaGameId) return;
    setManualLoading(true);
    setManualError('');
    try {
      const res = await api.getRetroAchievementsByRaGameId(manualRaGameId);
      const list = res?.achievements || [];
      setManualAchievements(list);
    } catch (err) {
      setManualError('Failed to fetch achievements.');
      setManualAchievements([]);
    } finally {
      setManualLoading(false);
    }
  };

  const availableAchievements = (() => {
    const combined = [...(achievements || []), ...(manualAchievements || [])];
    const seen = new Set();
    return combined.filter((a) => {
      const id = String(a._id || a.id || '');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  })();

  const saveFeaturedAchievements = async () => {
    if (!user) return;
    setSavingAchievements(true);
    try {
      const ids = Array.from(selectedAchievements);
      const res = await api.updateFeaturedAchievements(user.id, ids);
      if (res && res.user) updateUserData(res.user);
    } catch (err) {
      console.error('Failed to update featured achievements', err);
      alert('Failed to update achievements');
    } finally {
      setSavingAchievements(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="view active" aria-labelledby="profile-title">
        <div className="panel">
          <h2 id="profile-title">Trainer Profile</h2>
          <p className="map-hint">Please sign in to view your profile.</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="view active">
        <div className="loading">Loading profile...</div>
      </section>
    );
  }

  return (
    <section id="profile-view" className="view active profile-view" aria-labelledby="profile-title">
      <div className="panel profile-hero tech-card">
        <div className="profile-card">
          <img id="profile-avatar" className="profile-avatar" src={user?.avatarUrl || '/assets/pixel/6Vww.gif'} alt={`${user?.username || 'Trainer'} avatar`} />
          <div style={{ flex: 1 }}>
            <h2 id="profile-title">{user?.username || 'Trainer Profile'}</h2>
            <p className="map-hint">{user?.bio || 'Retro collector and walkthrough writer.'}</p>
          </div>
          <div className="profile-stats compact" role="list" aria-label="Profile summary stats">
            <div className="stat" role="listitem" aria-label={`Hours logged ${formatPlayTime(stats?.totalPlaySeconds || stats?.totalPlayTime)} hours`}>
              <div className="value">{formatPlayTime(stats?.totalPlaySeconds || stats?.totalPlayTime)} hrs</div>
              <div className="label">Hours logged</div>
              {typeof stats?.totalPlayTime === 'number' && (
                <div className="stat-sub">{Number(stats.totalPlayTime).toFixed(2)} hrs</div>
              )}
            </div>

            <div className="stat" role="listitem" aria-label={`${Math.max(stats?.forumPosts ?? 0, lastPosts.length)} forum posts`}>
              <div className="value">{Math.max(stats?.forumPosts ?? 0, lastPosts.length)}</div>
              <div className="label">Posts made</div>
            </div>

            <div className="stat" role="listitem" aria-label={`${stats?.achievementsCount ?? achievements.length ?? 0} achievements`}>
              <div className="value">{stats?.achievementsCount ?? achievements.length ?? 0}</div>
              <div className="label">Achievements</div>
            </div>
          </div>
        </div>

        <div className="panel-grid">
          <div className="panel tech-card fav-card" aria-labelledby="fav-game-title">
            <h3 id="fav-game-title">Favourite Game</h3>
            {Array.isArray(user?.favoriteGames) && user.favoriteGames.length > 0 ? (
              renderFavouriteGame()
            ) : (
              <div className="map-hint">No favourite yet — heart a game to add it here.</div>
            )}
          </div>

          <div className="panel tech-card" aria-labelledby="last-posts-title">
            <h3 id="last-posts-title">Last posts</h3>
            <div className="last-posts-list">
              {lastPosts.length === 0 ? (
                <div className="map-hint">No recent posts.</div>
              ) : (
                lastPosts.map(p => {
                    const thumbArt = (games.find(g => g.dbId === (p.gameId && p.gameId._id)) || {}).art || '';
                    const gid = (p.gameId && (p.gameId.slug || p.gameId._id)) || p.gameId || '';
                    return (
                  <div key={p._id || p.id} className="last-post-item compact" role="button" tabIndex={0} onClick={() => { if (gid) navigate(`/game/${gid}`, { state: { highlightPostId: p._id }, replace: false }); }} onKeyDown={(e) => { if (e.key==='Enter') { if (gid) navigate(`/game/${gid}`, { state: { highlightPostId: p._id }, replace: false }); } }}>
                    <div className="lp-thumb" style={{ backgroundImage: `url('${thumbArt}')` }} />
                    <div className="lp-body">
                      <div className="lp-game">{(p.gameId && (p.gameId.title || p.gameId.name)) || p.gameTitle || 'Unknown game'}</div>
                      <div className="lp-excerpt">{(p.content||'').slice(0,120)}{(p.content||'').length>120?'…':''}</div>
                      <div className="lp-time">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''} <span className="muted">· view</span></div>
                    </div>
                  </div>
                );
                })
              )}
            </div>
          </div>

          <div className="panel tech-card" aria-labelledby="achievements-title">
            <div className="panel-head">
              <h3 id="achievements-title">Achievements</h3>
              <button
                className="btn-cyber btn-sm"
                onClick={saveFeaturedAchievements}
                disabled={savingAchievements}
              >
                {savingAchievements ? 'Saving…' : 'Save selection'}
              </button>
            </div>
            <div className="subhead">Showcased</div>
            <div className="achievements-grid compact">
              {selectedAchievements.size === 0 ? (
                <div className="map-hint">No showcased achievements yet.</div>
              ) : (
                (featuredDetails.length ? featuredDetails : achievements.filter((a) => selectedAchievements.has(String(a._id))))
                  .map((a) => (
                    <div key={a._id} className="achievement-card small">
                      <div className="icon">{a.iconUrl || a.icon || '🏆'}</div>
                      <div className="name">{a.title || a.name}</div>
                    </div>
                  ))
              )}
            </div>
            <div className="subhead">Select achievements</div>
            <div className="achievements-grid compact">
              {availableAchievements.length === 0 ? (
                <div className="map-hint">No achievements yet.</div>
              ) : (
                availableAchievements.map(a => {
                  const id = String(a._id || a.id || '');
                  const selected = selectedAchievements.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`achievement-card small selectable ${selected ? 'selected' : ''}`}
                      onClick={() => toggleAchievementSelection(id)}
                      aria-pressed={selected}
                    >
                      <div className="icon">{a.iconUrl || a.icon || '🏆'}</div>
                      <div className="name">{a.title || a.name}</div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="subhead">Fetch achievements by game</div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ra-game-id">RetroAchievements Game ID</label>
                <input
                  id="ra-game-id"
                  type="number"
                  value={manualRaGameId}
                  onChange={(e) => setManualRaGameId(e.target.value)}
                  placeholder="e.g., 14402"
                />
              </div>
              <div className="form-group" style={{ alignSelf: 'end' }}>
                <button
                  type="button"
                  className="btn-cyber btn-sm"
                  onClick={fetchManualAchievements}
                  disabled={manualLoading || !manualRaGameId}
                >
                  {manualLoading ? 'Fetching…' : 'Fetch achievements'}
                </button>
              </div>
            </div>
            {manualError && <div className="map-hint">{manualError}</div>}
            <div className="map-hint">Select up to 6 achievements to showcase.</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
