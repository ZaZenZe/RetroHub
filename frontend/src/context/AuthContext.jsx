import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let heartbeatTimer = null;
    let sessionAccumulator = 0;
    let lastTick = Date.now();
    const trackingPaused = { current: false }; // simple mutable holder for pause/resume

    const sendHeartbeat = async () => {
      if (!user || !token) return;
      const toSend = sessionAccumulator;
      sessionAccumulator = 0;
      if (!toSend) return;
      try {
        const res = await api.postSessionSeconds(user.id, toSend);

        // update local stats in-context so UI (Profile) updates live
        if (res && res.stats) {
          // Normalize/validate server payload: prefer authoritative totalPlaySeconds and derive hours client-side
          const totalPlaySeconds = Number(res.stats.totalPlaySeconds) || 0;
          const totalPlayTime = Math.round(((totalPlaySeconds) / 3600) * 100) / 100;
          const normalized = { ...res.stats, totalPlaySeconds, totalPlayTime };

          // Sanity clamp: prevent wildly inflated values from showing (protect against bad writes)
          if (totalPlaySeconds > 60 * 60 * 24 * 365 * 5) { // >5 years in seconds
            console.warn('Received suspicious totalPlaySeconds, clamping for display', totalPlaySeconds);
            normalized.totalPlaySeconds = 0;
            normalized.totalPlayTime = 0;
          }

          setUserStats(normalized);
          try { localStorage.setItem(`retrohub:stats:${user.id}`, JSON.stringify(normalized)); } catch (e) {}
          try { localStorage.setItem(`retrohub:stats:update:${user.id}`, Date.now().toString()); } catch (e) {}
        }

        // update user meta for other consumers
        setUser((u) => {
          if (!u) return u;
          const next = { ...u, _meta: { ...(u._meta || {}), lastSessionUpdate: Date.now() } };
          try { localStorage.setItem('authUser', JSON.stringify(next)); } catch (e) {}
          return next;
        });
      } catch (e) {
        // ignore transient errors
      }
    };

    const tick = () => {
      const now = Date.now();
      const delta = Math.floor((now - lastTick) / 1000);
      lastTick = now;
      if (trackingPaused.current) return;
      if (document.visibilityState === 'visible' && token && user) {
        sessionAccumulator += delta;
      }
    };

    const startHeartbeat = () => {
      if (heartbeatTimer) return;
      lastTick = Date.now();
      heartbeatTimer = setInterval(async () => {
        tick();
        if (sessionAccumulator >= 30) {
          await sendHeartbeat();
        }
      }, 1000);
    };

    const stopHeartbeat = async () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      tick();
      if (sessionAccumulator > 0) await sendHeartbeat();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopHeartbeat();
      } else {
        startHeartbeat();
      }
    };

    const init = async () => {
      try {
        const storedUser = localStorage.getItem('authUser');
        const storedStats = storedUser && localStorage.getItem(`retrohub:stats:${(storedUser && JSON.parse(storedUser).id) || ''}`);
        if (storedStats) {
          try { setUserStats(JSON.parse(storedStats)); } catch (e) {}
        }

        if (!token) {
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          setLoading(false);
          return;
        }

        // ensure API has the token for validate call
        api.setToken(token);

        // try to refresh canonical user from server (includes moderatedGames)
        try {
          const data = await api.validate();
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('authUser', JSON.stringify(data.user));

            // fetch latest stats too
            try {
              const st = await api.getUserStats(data.user.id);
              if (st && st.stats) {
                setUserStats(st.stats);
                localStorage.setItem(`retrohub:stats:${data.user.id}`, JSON.stringify(st.stats));
              }
            } catch (e) {}

            setLoading(false);
            return;
          }
        } catch (err) {
          // validation failed — fall back to stored user if present
          console.warn('Auth validate failed, falling back to stored user', err && err.message);
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('authUser');
      } finally {
        setLoading(false);
      }
    };

    init();
    startHeartbeat();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', stopHeartbeat);

    // cross-tab: listen for stats updates and refresh local userStats
    const storageHandler = (ev) => {
      try {
        if (!ev.key) return;
        if (ev.key === `retrohub:stats:update:${(user && user.id) || ''}`) {
          const raw = localStorage.getItem(`retrohub:stats:${(user && user.id) || ''}`);
          if (raw) setUserStats(JSON.parse(raw));
        }
      } catch (e) {}
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', stopHeartbeat);
      window.removeEventListener('storage', storageHandler);
    };
  }, [token, user]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.token && data.user) {
      setUser(data.user);
      setToken(data.token);
      api.setToken(data.token);
      try { localStorage.setItem('authToken', data.token); localStorage.setItem('authUser', JSON.stringify(data.user)); } catch (e) {}
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.register(name, email, password);
    if (data.token && data.user) {
      setUser(data.user);
      setToken(data.token);
      api.setToken(data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
    }
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken('');
    api.setToken('');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  const updateUserData = (userData) => {
    setUser((prev) => {
      const next = { ...prev, ...userData };
      try { localStorage.setItem('authUser', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const refreshUserStats = async () => {
    if (!user || !token) return null;
    try {
      const res = await api.getUserStats(user.id);
      if (res && res.stats) {
        // normalize
        const totalPlaySeconds = Number(res.stats.totalPlaySeconds) || 0;
        const totalPlayTime = Math.round(((totalPlaySeconds) / 3600) * 100) / 100;
        const normalized = { ...res.stats, totalPlaySeconds, totalPlayTime };
        setUserStats(normalized);
        try { localStorage.setItem(`retrohub:stats:${user.id}`, JSON.stringify(normalized)); } catch (e) {}
        try { localStorage.setItem(`retrohub:stats:update:${user.id}`, Date.now().toString()); } catch (e) {}
      }
      return res && res.stats;
    } catch (err) {
      return null;
    }
  };

  // Pause/resume global tracking (used by page-level trackers to avoid double-counting)
  const pauseTracking = () => { trackingPaused.current = true; };
  const resumeTracking = () => { trackingPaused.current = false; };


  const isAdmin = user?.role === 'admin';
  const isMod = user?.role === 'mod' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userStats,
        token,
        loading,
        login,
        register,
        logout,
        updateUserData,
        refreshUserStats,
        pauseTracking,
        resumeTracking,
        isAuthenticated: !!user,
        isAdmin,
        isMod,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
