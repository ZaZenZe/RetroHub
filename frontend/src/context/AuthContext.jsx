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
  const [token, setToken] = useState(localStorage.getItem('authToken') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let heartbeatTimer = null;
    let sessionAccumulator = 0;
    let lastTick = Date.now();

    const sendHeartbeat = async () => {
      if (!user || !token) return;
      const toSend = sessionAccumulator;
      sessionAccumulator = 0;
      try {
        await api.postSessionSeconds(user.id, toSend);
        // update local stats display (optimistic)
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

    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', stopHeartbeat);
    };
  }, [token, user]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.token && data.user) {
      setUser(data.user);
      setToken(data.token);
      api.setToken(data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
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
      localStorage.setItem('authUser', JSON.stringify(next));
      return next;
    });
  };

  const isAdmin = user?.role === 'admin';
  const isMod = user?.role === 'mod' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUserData,
        isAuthenticated: !!user,
        isAdmin,
        isMod,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
