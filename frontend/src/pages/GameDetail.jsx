import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGames } from '../context/GamesContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';


const GameDetail = ({ onChatOpen, onGameChange }) => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { getGameById, fetchGameFull, loadPosts, createPost, deletePost, togglePostSpoiler, postsCache } = useGames();
  const { applyTheme } = useTheme();
  const { isAuthenticated, user, updateUserData, isAdmin, isMod } = useAuth();
  
  const [game, setGame] = useState(null);

  const handleToggleFavorite = async (e) => {
    e && e.stopPropagation && e.stopPropagation();
    if (!isAuthenticated || !user || !game || !game.dbId) return;
    const gid = game.dbId;
    const currently = Array.isArray(user.favoriteGames) && user.favoriteGames.includes(gid);

    // optimistic update
    const prev = user.favoriteGames || [];
    const nextFavs = currently ? prev.filter(x => x !== gid) : [...prev, gid];
    updateUserData({ favoriteGames: nextFavs });

    try {
      const res = await api.toggleFavoriteGame(user.id, gid, currently ? 'remove' : 'add');
      if (res && res.user) updateUserData(res.user);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      // revert
      updateUserData({ favoriteGames: prev });
      alert('Failed to update favourites');
    }
  };
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [revealedPosts, setRevealedPosts] = useState(new Set());

  const toggleReveal = (postId) => {
    setRevealedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleToggleSpoiler = async (post) => {
    if (!post || !game || !post._id) return;
    try {
      await togglePostSpoiler(game.dbId, post._id, !post.isSpoiler);
    } catch (err) {
      console.error('Failed to toggle spoiler:', err);
      // If server reports the post no longer exists, refresh UI silently
      if (err && (err.status === 404 || /post not found/i.test(err.message || ''))) {
        await loadPosts(game.dbId);
        return;
      }
      alert('Failed to update post');
    }
  };

  // Get posts directly from cache
  const posts = game?.dbId ? (postsCache.get(game.dbId) || []) : [];

  useEffect(() => {
    const loadGame = async () => {
      setLoading(true);
      try {
        let gameData = getGameById(gameId);
        if (!gameData) {
          gameData = await fetchGameFull(gameId);
        } else {
          const tipsMissing = !Array.isArray(gameData.tips) || gameData.tips.length === 0;
          const faqMissing = !Array.isArray(gameData.faq) || gameData.faq.length === 0;
          if (tipsMissing || faqMissing) {
            gameData = await fetchGameFull(gameId);
          }
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
      await loadPosts(gameDbId);
    } catch (error) {
      console.error('Failed to load posts:', error);
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
      // Posts will update automatically via postsCache
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
    <section id="game-view" className="view active game-view" aria-live="polite" aria-labelledby="game-title">
      <button className="back-btn" onClick={() => navigate('/')} aria-label="Back to Home">
        <span className="material-symbols-sharp">arrow_back</span>
        <span>RETURN_TO_ROOT</span>
      </button>

      <div className="game-hero">
        <div className="game-art tech-card">
          <div
            className={`art crt-screen ${heroUrl ? '' : 'no-image'}`}
            style={{ backgroundImage: heroUrl ? `url('${heroUrl}')` : '' }}
            aria-hidden="true"
          />
          <div className="art-label">IMG_SRC_01</div>
        </div>
        <div className="meta tech-card">
          <h2 id="game-title" className="game-title">{game.title}</h2>
          <div className="chips">
            <span className="chip">{game.platform || 'Platform TBA'}</span>
            <span className="chip">{game.year || 'Year TBA'}</span>
          </div>
          <p className="description">{game.description || NO_INFO}</p>
          <div className="quick-actions">
            <button className="btn-cyber" onClick={() => onChatOpen && onChatOpen()}>
              LAUNCH_AI
            </button>
            <button className="btn-cyber secondary" onClick={handleScrollToForum}>
              OPEN_COMMUNITY
            </button>

            {isAuthenticated && (
              <button
                type="button"
                className={`btn-icon favorite-toggle ${Array.isArray(user?.favoriteGames) && user.favoriteGames.includes(game?.dbId) ? 'fav' : ''}`}
                onClick={handleToggleFavorite}
                aria-pressed={Array.isArray(user?.favoriteGames) && user.favoriteGames.includes(game?.dbId)}
                title={Array.isArray(user?.favoriteGames) && user.favoriteGames.includes(game?.dbId) ? 'Unfavorite' : 'Add to favourites'}
              >
                <span className="material-symbols-sharp" aria-hidden="true">favorite</span>
                <span className="sr-only">{Array.isArray(user?.favoriteGames) && user.favoriteGames.includes(game?.dbId) ? 'Unfavorite' : 'Add to favourites'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="detail-middle" aria-label="Game details">
        <section className="panel tech-card" aria-labelledby="tips-title">
          <div className="section-head">
            <h3 id="tips-title">HACK_TIPS</h3>
          </div>
          <ul className="tips-list">
            {tips.map((tip, idx) => (
              <li key={idx}>
                {typeof tip === 'string' ? tip : (tip.content || tip.text || JSON.stringify(tip))}
              </li>
            ))}
          </ul>
        </section>
        
        <section className="panel tech-card" aria-labelledby="faq-title">
          <div className="section-head">
            <h3 id="faq-title">POPULAR_QUESTIONS</h3>
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
        <div className="panel shots-panel tech-card" aria-labelledby="shots-title">
          <h3 id="shots-title">MEDIA_FILES</h3>
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

      <section className="panel forum tech-card" id="forum" aria-labelledby="forum-title">
        <h3 id="forum-title">GLOBAL_CHAT_STREAM</h3>
        {isAuthenticated ? (
          <form className="post-form" onSubmit={handlePostSubmit} autoComplete="off">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Share a tip, ask a question…"
              aria-label="Your message"
              required
            />
            <button type="submit" className="btn-cyber">
              BLAB
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

              const isOwner = post.userId && post.userId._id === (user && (user.id || user._id));
              const canManagePost = isOwner || isAdmin || (isMod && user && Array.isArray(user.moderatedGames) && user.moderatedGames.includes(game?.dbId));

              return (
                <li key={post._id || idx} className="post">
                  <div className="meta">
                    <div className="meta-left">
                      <span>{author}</span>
                      <span>•</span>
                      <span>{timestamp}</span>
                    </div>

                    <div className="meta-right actions">
                      {/* Upvote / dislike controls (supports toggle/unvote) */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginRight: 8 }}>
                        <button
                          type="button"
                          className={`btn-icon vote-btn ${(post.voteMap && post.voteMap[user?.id] === 'up') ? 'active' : ''}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) return alert('Sign in to vote');
                            if (!post || !post._id) return;
                            const meVote = post.voteMap && post.voteMap[user?.id];
                            const direction = meVote === 'up' ? 'none' : 'up';
                            try {
                              await api.votePost(post._id, direction);
                              await loadPosts(game.dbId);
                            } catch (err) {
                              console.error('Failed to vote:', err);
                              alert('Failed to register vote');
                            }
                          }}
                          aria-pressed={post.voteMap && post.voteMap[user?.id] === 'up'}
                          title="Upvote / remove upvote"
                          onKeyDown={(ev) => ev.stopPropagation()}
                        >
                          <span className="material-symbols-sharp">thumb_up</span>
                        </button>
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{post.upvotes || 0}</div>

                        <button
                          type="button"
                          className={`btn-icon vote-btn ${(post.voteMap && post.voteMap[user?.id] === 'down') ? 'active' : ''}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) return alert('Sign in to vote');
                            if (!post || !post._id) return;
                            const meVote = post.voteMap && post.voteMap[user?.id];
                            const direction = meVote === 'down' ? 'none' : 'down';
                            try {
                              await api.votePost(post._id, direction);
                              await loadPosts(game.dbId);
                            } catch (err) {
                              console.error('Failed to vote:', err);
                              alert('Failed to register vote');
                            }
                          }}
                          aria-pressed={post.voteMap && post.voteMap[user?.id] === 'down'}
                          title="Downvote / remove downvote"
                          onKeyDown={(ev) => ev.stopPropagation()}
                        >
                          <span className="material-symbols-sharp">thumb_down</span>
                        </button>
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{post.downvotes || 0}</div>
                      </div>

                      {canManagePost ? (
                        <>
                          <button className="cta danger small" onClick={async () => {
                            if (!post || !post._id) return;
                            if (!confirm('Delete this post?')) return;
                            try {
                              await deletePost(game.dbId, post._id);
                            } catch (err) {
                              console.error('Failed to delete post:', err);
                              if (err && (err.status === 404 || /post not found/i.test(err.message || ''))) {
                                await loadPosts(game.dbId);
                                return;
                              }
                              alert('Failed to delete post');
                            }
                          }}>Delete</button>

                          <button className="cta secondary small" onClick={() => handleToggleSpoiler(post)}>
                            {post.isSpoiler ? 'Unmark spoiler' : 'Mark as spoiler'}
                          </button>
                        </>
                      ) : (
                        <div style={{ color: 'var(--admin-muted)', fontSize: 13 }}>No actions</div>
                      )}
                    </div>
                  </div>

                  <div className="bubble">
                    {post.isSpoiler && !revealedPosts.has(post._id) ? (
                      <div className="spoiler-mask">
                        <div className="label">
                          <div className="title">Spoiler — content hidden</div>
                          <div>
                            <button className="cta small" onClick={() => toggleReveal(post._id)}>Show</button>
                          </div>
                        </div>
                        <div className="hint">Marked as spoiler{post.spoilerMarkedBy ? ` by ${post.spoilerMarkedBy.username || post.spoilerMarkedBy}` : ''}.</div>
                      </div>
                    ) : (
                      <div className="text">{post.content}</div>
                    )}
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
