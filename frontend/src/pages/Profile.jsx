import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGames } from '../context/GamesContext';
import api from '../services/api';

const Profile = () => {
  const { isAuthenticated, user } = useAuth();
  const { games } = useGames();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [userGames, setUserGames] = useState([]);
  const [collectionFilter, setCollectionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [statsRes, achRes, gamesRes] = await Promise.all([
          api.getUserStats(user?.id),
          api.getUserAchievements(user?.id),
          api.getUserGames(user?.id),
        ]);

        setStats(statsRes?.stats || null);
        setAchievements(achRes?.achievements || []);
        
        // Merge user games with game catalog
        const userGamesList = gamesRes?.games || [];
        const collection = buildCollection(userGamesList);
        setUserGames(collection);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [isAuthenticated, user?.id]);

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
    <section id="profile-view" className="view active" aria-labelledby="profile-title">
      <div className="panel profile-hero tech-card">
        <div className="profile-card">
          <img
            id="profile-avatar"
            className="profile-avatar"
            src="/assets/pixel/6Vww.gif"
            alt="Trainer avatar"
          />
          <div>
            <h2 id="profile-title">Trainer Profile</h2>
            <p className="map-hint">Retro collector and walkthrough writer.</p>
            <div className="chips" id="profile-tags">
              <span className="chip">Collector</span>
              <span className="chip">Completionist</span>
              <span className="chip">Speedrunner</span>
            </div>
          </div>
        </div>
        <div className="profile-stats">
          {stats && (
            <>
              <div className="stat">
                <span className="label">Games Played</span>
                <span className="value">{stats.totalGames || 0}</span>
              </div>
              <div className="stat">
                <span className="label">Hours Logged</span>
                <span className="value">{stats.completedGames || 0}</span>
              </div>
              <div className="stat">
                <span className="label">Achievements</span>
                <span className="value">{stats.achievementsCount || 0}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="panel tech-card" aria-labelledby="collection-title">
        <div className="section-head">
          <div>
            <h3 id="collection-title">Collection</h3>
            <p className="map-hint">Filter by platform or completion.</p>
          </div>
          <div className="filter-group compact">
            <label htmlFor="collection-filter">Platform</label>
            <select
              id="collection-filter"
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="GBA">GBA</option>
              <option value="DS">DS</option>
              <option value="3DS">3DS</option>
            </select>
          </div>
        </div>
        <div className="collection-grid">
          {filteredGames.length === 0 ? (
            <p className="map-hint">No games in this filter yet.</p>
          ) : (
            filteredGames.map((item) => (
              <article key={item.id} className="collection-card">
                <div
                  className="thumb"
                  style={{ backgroundImage: `url('${item.art || ''}')` }}
                />
                <div className="meta">
                  <div className="title">{item.title}</div>
                  <div className="chips">
                    <span className="chip">{item.platform || 'TBA'}</span>
                    <span className="chip">{item.status}</span>
                  </div>
                  <div
                    className="progress"
                    aria-label={`${item.progress}% complete`}
                  >
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="panel tech-card" aria-labelledby="achievements-title">
        <h3 id="achievements-title">ACHIEVEMENTS</h3>
        <div className="achievements-grid">
          {achievements.length === 0 ? (
            <p className="map-hint">No achievements yet.</p>
          ) : (
            achievements.map((a) => (
              <div key={a._id} className="achievement-card tech-card">
                <div className="icon">{a.icon || '🏆'}</div>
                <div className="name">{a.name}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Profile;
