import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGames } from '../context/GamesContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const GameDetail = ({ onChatOpen, onGameChange }) => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { getGameById, fetchGameFull, loadPosts, createPost } = useGames();
  const { applyTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  
  const [game, setGame] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  useEffect(() => {
    const loadGame = async () => {
      setLoading(true);
      try {
        let gameData = getGameById(gameId);
        if (!gameData) {
          gameData = await fetchGameFull(gameId);
        } else if (!gameData.tips || !gameData.faq) {
          gameData = await fetchGameFull(gameId);
        }
        
        if (gameData) {
          setGame(gameData);
          
          // Apply theme
          if (gameData.theme && gameData.theme.colors) {
            applyTheme(gameData.theme);
          }
          
          // Load posts
          if (gameData.dbId) {
            loadGamePosts(gameData.dbId);
          }
        }
      } catch (error) {
        console.error('Failed to load game:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId, getGameById, fetchGameFull, applyTheme]);

  useEffect(() => {
    if (onGameChange) {
      onGameChange(game || null);
    }
  }, [game, onGameChange]);

  const loadGamePosts = async (gameDbId) => {
    setPostsLoading(true);
    try {
      const postsData = await loadPosts(gameDbId);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postText.trim() || !game || !isAuthenticated) return;

    try {
      await createPost(game.dbId, postText.trim());
      setPostText('');
      // Reload posts
      await loadGamePosts(game.dbId);
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to post. Please try again.');
    }
  };

  const handleScrollToForum = () => {
    const forumEl = document.getElementById('forum');
    if (forumEl) {
      forumEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openScreenshot = (index) => {
    setSelectedScreenshot(index);
  };

  const closeScreenshot = () => {
    setSelectedScreenshot(null);
  };

  const nextScreenshot = () => {
    if (game && game.screenshots && selectedScreenshot !== null) {
      setSelectedScreenshot((selectedScreenshot + 1) % game.screenshots.length);
    }
  };

  const prevScreenshot = () => {
    if (game && game.screenshots && selectedScreenshot !== null) {
      const len = game.screenshots.length;
      setSelectedScreenshot((selectedScreenshot - 1 + len) % len);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedScreenshot === null) return;
      if (e.key === 'ArrowRight') nextScreenshot();
      else if (e.key === 'ArrowLeft') prevScreenshot();
      else if (e.key === 'Escape') closeScreenshot();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedScreenshot]);

  if (loading) {
    return (
      <section className="view active">
        <div className="loading">Loading game...</div>
      </section>
    );
  }

  if (!game) {
    return (
      <section className="view active">
        <div className="empty-state">
          <p>Game not found</p>
          <button className="cta" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </section>
    );
  }

  const NO_INFO = "It's dangerous to go alone! No info yet.";
  const tips = game.tips && game.tips.length ? game.tips : [NO_INFO];
  const faqs = game.faq && game.faq.length ? game.faq : null;
  
  const heroUrl = game.gameplayGif || game.hero || game.art || '';
  const screenshots = Array.isArray(game.screenshots) && game.screenshots.length
    ? game.screenshots.map((s) =>
        typeof s === 'string' ? { url: s, alt: `${game.title} screenshot` } : s
      )
    : game.hero || game.art
    ? [{ url: game.hero || game.art, alt: `${game.title} screenshot` }]
    : [];

  return (
    <section id="game-view" className="view active" aria-live="polite" aria-labelledby="game-title">
      <div className="game-hero">
        <button className="back-btn" onClick={() => navigate('/')} aria-label="Back to Home">
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </button>
        <div
          className={`art ${heroUrl ? '' : 'no-image'}`}
          style={{ backgroundImage: heroUrl ? `url('${heroUrl}')` : '' }}
          aria-hidden="true"
        />
        <div className="meta">
          <h2 id="game-title">{game.title}</h2>
          <div className="chips">
            <span className="chip">{game.platform || 'Platform TBA'}</span>
            <span className="chip">{game.year || 'Year TBA'}</span>
          </div>
          <p className="description">{game.description || NO_INFO}</p>
          <div className="quick-actions">
            <button className="cta" onClick={() => onChatOpen && onChatOpen()}>
              Ask help from AI
            </button>
            <button className="cta secondary" onClick={handleScrollToForum}>
              Blab about it in community
            </button>
          </div>
        </div>
      </div>

      <div className="detail-middle" aria-label="Game details">
        <section className="panel" aria-labelledby="tips-title">
          <div className="section-head">
            <h3 id="tips-title">Quick Tips</h3>
          </div>
          <ul className="tips-list">
            {tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </section>
        
        <section className="panel" aria-labelledby="faq-title">
          <div className="section-head">
            <h3 id="faq-title">Popular Questions</h3>
          </div>
          <div className="faq">
            {!faqs ? (
              <div className="map-hint">{NO_INFO}</div>
            ) : (
              faqs.map((faq, idx) => (
                <details key={idx}>
                  <summary>{faq.q || 'Question TBD'}</summary>
                  <p>{faq.a || NO_INFO}</p>
                </details>
              ))
            )}
          </div>
        </section>
      </div>

      {screenshots.length > 0 && (
        <div className="panel shots-panel" aria-labelledby="shots-title">
          <h3 id="shots-title">Screenshots</h3>
          <div className="shots-strip" role="list">
            {screenshots.map((shot, idx) => (
              <button
                key={idx}
                className="shot-thumb"
                type="button"
                role="listitem"
                aria-label={shot.alt || `${game.title} screenshot ${idx + 1}`}
                onClick={() => openScreenshot(idx)}
              >
                <img src={shot.url} alt={shot.alt} loading="lazy" />
              </button>
            ))}
          </div>
          <p className="map-hint">Swipe or scroll horizontally. Tap a screenshot to expand.</p>
        </div>
      )}

      <section className="panel forum" id="forum" aria-labelledby="forum-title">
        <h3 id="forum-title">Blabbers</h3>
        {isAuthenticated ? (
          <form className="post-form" onSubmit={handlePostSubmit} autoComplete="off">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Share a tip, ask a question…"
              aria-label="Your message"
              required
            />
            <button type="submit" className="cta">
              Blab
            </button>
          </form>
        ) : (
          <p className="map-hint">Sign in to post to the community.</p>
        )}
        <ul className="posts" role="list">
          {postsLoading ? (
            <li className="post">
              <div className="bubble">
                <div className="text">Loading posts…</div>
              </div>
            </li>
          ) : posts.length === 0 ? (
            <li className="post">
              <div className="bubble">
                <div className="text">
                  No posts yet. Be the first to share a tip or ask a question!
                </div>
              </div>
            </li>
          ) : (
            posts.map((post, idx) => {
              const author =
                (post.userId && (post.userId.username || post.userId.email)) || 'Member';
              const timestamp = post.createdAt
                ? new Date(post.createdAt).toLocaleString()
                : '';
              return (
                <li key={idx} className="post">
                  <div className="meta">
                    <span>{author}</span>
                    <span>•</span>
                    <span>{timestamp}</span>
                  </div>
                  <div className="bubble">
                    <div className="text">{post.content}</div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* Screenshot Modal */}
      {selectedScreenshot !== null && screenshots[selectedScreenshot] && (
        <div
          id="shot-modal"
          className="map-modal"
          aria-hidden="false"
          role="dialog"
          aria-label="Screenshot viewer"
        >
          <div className="map-modal-backdrop" onClick={closeScreenshot} />
          <div className="map-modal-content" role="document">
            <button
              className="map-modal-close material-symbols-outlined"
              type="button"
              aria-label="Close screenshot"
              onClick={closeScreenshot}
            >
              close
            </button>
            <button
              className="shot-nav prev"
              type="button"
              aria-label="Previous screenshot"
              onClick={prevScreenshot}
              disabled={screenshots.length <= 1}
            >
              <span className="material-symbols-rounded">chevron_left</span>
            </button>
            <img
              id="shot-modal-image"
              src={screenshots[selectedScreenshot].url}
              alt={screenshots[selectedScreenshot].alt || 'Screenshot full view'}
            />
            <button
              className="shot-nav next"
              type="button"
              aria-label="Next screenshot"
              onClick={nextScreenshot}
              disabled={screenshots.length <= 1}
            >
              <span className="material-symbols-rounded">chevron_right</span>
            </button>
            <div className="map-modal-actions">
              <a
                className="cta secondary"
                href={screenshots[selectedScreenshot].url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open original
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GameDetail;
