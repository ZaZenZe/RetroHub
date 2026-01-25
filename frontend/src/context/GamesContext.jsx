import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

const GamesContext = createContext(null);

export const useGames = () => {
  const context = useContext(GamesContext);
  if (!context) {
    throw new Error('useGames must be used within GamesProvider');
  }
  return context;
};

export const GamesProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [gamesById, setGamesById] = useState(new Map());
  const [gamesByDbId, setGamesByDbId] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache for tips, faqs, and posts
  const [tipsCache, setTipsCache] = useState(new Map());
  const [faqCache, setFaqCache] = useState(new Map());
  const [postsCache, setPostsCache] = useState(new Map());

  const mapApiGame = useCallback((g) => {
    if (!g || !g._id) return null;
    return {
      id: g.slug || g._id,
      dbId: g._id,
      title: g.title || '',
      slug: g.slug || '',
      platform: g.platform || '',
      year: g.releaseYear || g.year || '',
      version: g.version || '',
      description: g.description || '',
      art: g.media?.coverImage || g.coverImageUrl || '',
      artGif: g.media?.coverGif || g.coverGifUrl || '',
      hero: g.media?.heroImage || g.heroImageUrl || '',
      gameplayGif: g.media?.gameplayGif || g.gameplayGifUrl || '',
      hover: g.media?.hoverImage || g.hoverImageUrl || '',
      hoverGif: g.media?.hoverGif || g.hoverGifUrl || '',
      screenshots: g.media?.screenshots || g.screenshots || [],
      tips: g.tips || [],
      faq: g.faqs || [],
      theme: g.theme || {},
    };
  }, []);

  const loadGames = useCallback(async () => {
    if (games.length > 0) return; // Already loaded
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGames();
      const rawGames = Array.isArray(data) ? data : data?.games || [];
      const mapped = rawGames.map(mapApiGame).filter(Boolean);
      setGames(mapped);

      // Build index maps
      const byId = new Map();
      const byDbId = new Map();
      mapped.forEach((game) => {
        byId.set(game.id, game);
        byDbId.set(game.dbId, game);
      });
      setGamesById(byId);
      setGamesByDbId(byDbId);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  }, [games.length, mapApiGame]);

  const fetchGameFull = useCallback(async (id) => {
    try {
      const data = await api.getGameFull(id);
      const game = mapApiGame(data?.game);
      if (game) {
        const tips = (data?.tips || []).map((t) => t.content || t).filter(Boolean);
        const faqs = (data?.faqs || [])
          .map((f) => ({ q: f.question, a: f.answer }))
          .filter(Boolean);

        game.tips = tips;
        game.faq = faqs;

        // Update caches
        setTipsCache((prev) => new Map(prev).set(game.dbId, tips));
        setFaqCache((prev) => new Map(prev).set(game.dbId, faqs));

        // Update game in state
        setGames((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, ...game } : g))
        );
        setGamesById((prev) => new Map(prev).set(game.id, game));
        setGamesByDbId((prev) => new Map(prev).set(game.dbId, game));
      }
      return game;
    } catch (err) {
      console.error('Failed to fetch game:', err);
      throw err;
    }
  }, [mapApiGame]);

  const getGameById = useCallback((id) => gamesById.get(id), [gamesById]);
  const getGameByDbId = useCallback((dbId) => gamesByDbId.get(dbId), [gamesByDbId]);

  const loadTips = useCallback(async (gameDbId) => {
    if (tipsCache.has(gameDbId)) {
      return tipsCache.get(gameDbId);
    }
    const { tips = [] } = await api.getTips(gameDbId);
    setTipsCache((prev) => new Map(prev).set(gameDbId, tips));
    return tips;
  }, [tipsCache]);

  const loadFaqs = useCallback(async (gameDbId) => {
    if (faqCache.has(gameDbId)) {
      return faqCache.get(gameDbId);
    }
    const { faqs = [] } = await api.getFaqs(gameDbId);
    setFaqCache((prev) => new Map(prev).set(gameDbId, faqs));
    return faqs;
  }, [faqCache]);

  const loadPosts = useCallback(async (gameDbId) => {
    if (postsCache.has(gameDbId)) {
      return postsCache.get(gameDbId);
    }
    const { posts = [] } = await api.getPosts(gameDbId);
    setPostsCache((prev) => new Map(prev).set(gameDbId, posts));
    return posts;
  }, [postsCache]);

  const createPost = useCallback(async (gameDbId, content) => {
    const result = await api.createPost(gameDbId, content);
    const newPost = result?.post;
    
    // Optimistically update the posts cache with the new post
    if (newPost) {
      setPostsCache((prev) => {
        const newCache = new Map(prev);
        const existingPosts = newCache.get(gameDbId);
        if (existingPosts && Array.isArray(existingPosts)) {
          // Add the new post to the beginning of the posts array
          newCache.set(gameDbId, [newPost, ...existingPosts]);
        } else {
          // If no cache exists, create a new entry
          newCache.set(gameDbId, [newPost]);
        }
        return newCache;
      });
    }
    
    return result;
  }, []);

  // Optimistic post operations — keep UI in sync immediately and notify other tabs
  const deletePost = useCallback(async (gameDbId, postId) => {
    if (!gameDbId || !postId) throw new Error('gameId and postId required');

    setPostsCache((prev) => {
      const newCache = new Map(prev);
      const existing = Array.isArray(newCache.get(gameDbId)) ? newCache.get(gameDbId) : [];
      newCache.set(gameDbId, existing.filter(p => (p._id || p.id) !== postId));
      return newCache;
    });

    try {
      const res = await api.deletePost(postId);
      try { localStorage.setItem(`retrohub:posts:update:${gameDbId}`, Date.now().toString()); } catch (e) {}
      return res;
    } catch (err) {
      await loadPosts(gameDbId).catch(() => {});
      throw err;
    }
  }, [loadPosts]);

  const togglePostSpoiler = useCallback(async (gameDbId, postId, isSpoiler) => {
    if (!gameDbId || !postId) throw new Error('gameId and postId required');

    setPostsCache((prev) => {
      const newCache = new Map(prev);
      const existing = Array.isArray(newCache.get(gameDbId)) ? newCache.get(gameDbId) : [];
      newCache.set(gameDbId, existing.map(p => ((p._id === postId || p.id === postId) ? { ...p, isSpoiler, spoilerMarkedBy: isSpoiler ? { username: 'You' } : null } : p)));
      return newCache;
    });

    try {
      const res = await api.togglePostSpoiler(postId, isSpoiler);
      await loadPosts(gameDbId).catch(() => {});
      try { localStorage.setItem(`retrohub:posts:update:${gameDbId}`, Date.now().toString()); } catch (e) {}
      return res;
    } catch (err) {
      await loadPosts(gameDbId).catch(() => {});
      throw err;
    }
  }, [loadPosts]);

  useEffect(() => {
    const handler = (ev) => {
      try {
        if (!ev.key || !ev.key.startsWith('retrohub:posts:update:')) return;
        const gameId = ev.key.replace('retrohub:posts:update:', '');
        if (!gameId) return;
        loadPosts(gameId).catch(() => {});
      } catch (e) {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadPosts]);

  const createGame = useCallback(async (gameData) => {
    const result = await api.createGame(gameData);
    const newGame = result?.game;
    
    // Optimistically add the new game to the games list
    if (newGame) {
      const mappedGame = mapApiGame(newGame);
      setGames((prev) => [mappedGame, ...prev]);
    }
    
    return result;
  }, []);

  const updateGame = useCallback(async (gameId, gameData) => {
    const result = await api.updateGame(gameId, gameData);
    const updatedGame = result?.game;
    
    // Optimistically update the game in the games list
    if (updatedGame) {
      const mappedGame = mapApiGame(updatedGame);
      setGames((prev) => 
        prev.map((game) => 
          game.dbId === updatedGame._id || game.id === gameId 
            ? mappedGame 
            : game
        )
      );
      
      // Clear related caches
      setTipsCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(updatedGame._id);
        return newCache;
      });
      setFaqCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(updatedGame._id);
        return newCache;
      });
    }
    
    return result;
  }, []);

  const deleteGame = useCallback(async (gameId) => {
    await api.deleteGame(gameId);
    
    // Remove the game from the list
    setGames((prev) => prev.filter((game) => game.id !== gameId && game.dbId !== gameId));
    
    // Clear all related caches
    setTipsCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(gameId);
      return newCache;
    });
    setFaqCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(gameId);
      return newCache;
    });
    setPostsCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(gameId);
      return newCache;
    });
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const value = useMemo(
    () => ({
      games,
      loading,
      error,
      loadGames,
      fetchGameFull,
      getGameById,
      getGameByDbId,
      loadTips,
      loadFaqs,
      loadPosts,
      createPost,
      deletePost,
      togglePostSpoiler,
      createGame,
      updateGame,
      deleteGame,
      tipsCache,
      faqCache,
      postsCache,
    }),
    [
      games,
      loading,
      error,
      loadGames,
      fetchGameFull,
      getGameById,
      getGameByDbId,
      loadTips,
      loadFaqs,
      loadPosts,
      createPost,
      deletePost,
      togglePostSpoiler,
      createGame,
      updateGame,
      deleteGame,
      tipsCache,
      faqCache,
      postsCache,
    ]
  );

  return (
    <GamesContext.Provider value={value}>
      {children}
    </GamesContext.Provider>
  );
};
