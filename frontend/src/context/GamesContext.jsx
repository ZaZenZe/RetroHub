import { createContext, useContext, useState, useEffect } from 'react';
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

  const mapApiGame = (g) => {
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
      art: g.media?.coverImage || '',
      artGif: g.media?.coverGif || '',
      hero: g.media?.heroImage || '',
      gameplayGif: g.media?.gameplayGif || '',
      hover: g.media?.hoverImage || '',
      hoverGif: g.media?.hoverGif || '',
      screenshots: g.media?.screenshots || [],
      tips: g.tips || [],
      faq: g.faqs || [],
      theme: g.theme || {},
    };
  };

  const loadGames = async () => {
    if (games.length > 0) return; // Already loaded
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGames();
      const mapped = (data?.games || []).map(mapApiGame).filter(Boolean);
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
  };

  const fetchGameFull = async (id) => {
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
  };

  const getGameById = (id) => gamesById.get(id);
  const getGameByDbId = (dbId) => gamesByDbId.get(dbId);

  const loadTips = async (gameDbId) => {
    if (tipsCache.has(gameDbId)) {
      return tipsCache.get(gameDbId);
    }
    const { tips = [] } = await api.getTips(gameDbId);
    setTipsCache((prev) => new Map(prev).set(gameDbId, tips));
    return tips;
  };

  const loadFaqs = async (gameDbId) => {
    if (faqCache.has(gameDbId)) {
      return faqCache.get(gameDbId);
    }
    const { faqs = [] } = await api.getFaqs(gameDbId);
    setFaqCache((prev) => new Map(prev).set(gameDbId, faqs));
    return faqs;
  };

  const loadPosts = async (gameDbId) => {
    if (postsCache.has(gameDbId)) {
      return postsCache.get(gameDbId);
    }
    const { posts = [] } = await api.getPosts(gameDbId);
    setPostsCache((prev) => new Map(prev).set(gameDbId, posts));
    return posts;
  };

  const createPost = async (gameDbId, content) => {
    const result = await api.createPost(gameDbId, content);
    // Invalidate cache
    setPostsCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(gameDbId);
      return newCache;
    });
    return result;
  };

  useEffect(() => {
    loadGames();
  }, []);

  return (
    <GamesContext.Provider
      value={{
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
        tipsCache,
        faqCache,
        postsCache,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
};
