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

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [statsRes, achRes, gamesRes, postsRes] = await Promise.all([
          api.getUserStats(user?.id),
          api.getUserAchievements(user?.id),
          api.getUserGames(user?.id),
          api.getLastPosts(user?.id),
        ]);

        setStats(statsRes?.stats || null);
        setAchievements(achRes?.achievements || []);
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
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [isAuthenticated, user?.id, games]);

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
    if (raw == null) return '0m';
    // Prefer seconds when available; if caller passed hours (decimal) convert to seconds.
    let seconds = 0;
    if (Number.isFinite(raw)) {
      // If raw looks like seconds (>= 60) assume seconds, otherwise treat as hours
      seconds = raw >= 60 ? Math.floor(raw) : Math.round(raw * 3600);
    } else {
      return '0m';
    }

    // Sanity: clamp absurd values for display (prevent runaway numbers from bad writes)
    const maxReasonableSeconds = 60 * 60 * 24 * 365 * 10; // 10 years
    if (seconds > maxReasonableSeconds) return '—';

    if (seconds === 0) return '0m';
    if (seconds < 60) return '<1m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    if (hrs >= 24) {
      const days = Math.floor(hrs / 24);
      const rem = hrs % 24;
      return `${days}d${rem ? ` ${rem}h` : ''}`;
    }
    return `${hrs}h${mins ? ` ${mins}m` : ''}`;
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
            <div className="stat" role="listitem" aria-label={`Hours logged ${formatPlayTime(stats?.totalPlaySeconds || stats?.totalPlayTime)}`}>
              <div className="value">{formatPlayTime(stats?.totalPlaySeconds || stats?.totalPlayTime)}</div>
              <div className="label">Hours logged</div>
              {typeof stats?.totalPlayTime === 'number' && (
                <div className="stat-sub">{stats.totalPlayTime} hrs</div>
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
            <h3 id="achievements-title">Achievements</h3>
            <div className="achievements-grid compact">
              {achievements.length === 0 ? (
                <div className="map-hint">No achievements yet.</div>
              ) : (
                achievements.map(a => (
                  <div key={a._id} className="achievement-card small">
                    <div className="icon">{a.icon || '🏆'}</div>
                    <div className="name">{a.name}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
