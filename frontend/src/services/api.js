// API Service Layer
import { Capacitor } from '@capacitor/core';

// Fallback; we resolve the real base at runtime inside ApiService to ensure Capacitor is initialized
const DEFAULT_WEB_API = '/api';

function resolveApiBaseForRuntime() {
  try {
    const nativeBase = import.meta.env.VITE_API_BASE_NATIVE || import.meta.env.VITE_API_BASE_ANDROID;
    const webBase = import.meta.env.VITE_API_BASE;
    const isNative = !!(Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
    const resolved = isNative ? (nativeBase || 'http://10.0.2.2:5173/api') : (webBase || DEFAULT_WEB_API);
    // Ensure the value is visible in device logs
    // eslint-disable-next-line no-console
    console.log('[ApiService][BASE_RESOLVED]', { isNative, resolved, env_native: nativeBase, env_web: webBase });
    // expose for quick runtime inspection
    try { window.__RETROHUB_API_BASE = resolved; } catch (e) {}
    return resolved;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[ApiService][BASE_RESOLVE_ERROR]', err && err.message);
    return DEFAULT_WEB_API;
  }
}

const DEFAULT_TIMEOUT = 8000;
const RETRYABLE_STATUS = new Set([502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken') || '';
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    // Direct fetch to avoid JSON headers
    const response = await fetch(`${resolveApiBaseForRuntime()}/admin/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
       let error = 'Upload failed';
       try {
         const data = await response.json();
         error = data.error || error;
       } catch (e) {}
       throw new Error(error);
    }
    
    return response.json();
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  getStoredUserId() {
    try {
      const raw = localStorage.getItem('authUser');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed?._id || '';
    } catch (error) {
      return '';
    }
  }

  async request(path, options = {}, config = {}) {
    const headers = this.getHeaders();
    const method = (options.method || 'GET').toUpperCase();
    const timeout = config.timeout || DEFAULT_TIMEOUT;
    const retries =
      typeof config.retries === 'number' ? config.retries : method === 'GET' ? 2 : 0;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      // Diagnostic: log attempted request (appears in WebView console / logcat)
      try {
        // eslint-disable-next-line no-console
        console.log('[ApiService] request ->', finalUrl || `${resolveApiBaseForRuntime()}${path}`, 'method=', method, 'attempt=', attempt, 'nativeCacheBust=', (isGet && isNative) || false);
      } catch (e) {}

      try {
        // Build final URL and apply native cache-busting for GET requests to avoid SW/stale caches
        const base = resolveApiBaseForRuntime();
        let finalUrl = `${base}${path}`.replace(/([^:])\/\//g, '$1/');

        const isGet = method === 'GET';
        const isNative = typeof window !== 'undefined' && !!window.__RETROHUB_API_BASE || (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
        if (isGet && isNative) {
          const sep = finalUrl.includes('?') ? '&' : '?';
          finalUrl = `${finalUrl}${sep}_t=${Date.now()}`;
        }

        const fetchOptions = {
          ...options,
          headers: { ...headers, ...options.headers },
          signal: controller.signal,
        };

        if (isGet && isNative) {
          fetchOptions.cache = 'no-store';
          fetchOptions.headers = { ...fetchOptions.headers, 'Cache-Control': 'no-store' };
        }

        const response = await fetch(finalUrl, fetchOptions);

        let payload = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            payload = await response.json();
          } catch (parseError) {
            payload = null;
          }
        }

        if (!response.ok) {
          const err = new Error(
            (payload && payload.error) || response.statusText || 'Request failed'
          );
          err.status = response.status;
          err.response = payload;

          if (response.status === 401) {
            this.setToken('');
          }

          if (attempt < retries && RETRYABLE_STATUS.has(response.status)) {
            await sleep(300 * (attempt + 1));
            continue;
          }

          throw err;
        }

        return payload;
      } catch (err) {
        // Log network / fetch errors for easier diagnosis on device
        try {
          // eslint-disable-next-line no-console
          console.error('[ApiService][ERROR]', `${resolveApiBaseForRuntime()}${path}`, err && err.message ? err.message : err, 'status=', err && err.status);
        } catch (logErr) {}

        if (err.name === 'AbortError') {
          // DOMException.message is read-only in some browsers; wrap to set a friendly message
          const wrapped = new Error('Request timeout');
          wrapped.name = 'AbortError';
          wrapped.status = err.status;
          throw wrapped;
        }

        const isNetworkError = err instanceof TypeError || err.name === 'AbortError';
        if (attempt < retries && isNetworkError) {
          await sleep(300 * (attempt + 1));
          continue;
        }

        throw err;
      } finally {
        clearTimeout(timer);
      }
    }

    return null;
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async validate() {
    return this.request('/auth/validate');
  }

  async register(username, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  // User
  async getUser(userId) {
    const id = userId || this.getStoredUserId();
    if (!id) throw new Error('User not available');
    return this.request(`/users/${encodeURIComponent(id)}`);
  }

  async updateUser(userId, data) {
    const id = userId || this.getStoredUserId();
    if (!id) throw new Error('User not available');
    return this.request(`/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePassword(userId, oldPassword, newPassword) {
    const id = userId || this.getStoredUserId();
    if (!id) throw new Error('User not available');
    return this.request(`/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword }),
    });
  }

  async getUserStats(userId) {
    const id = userId || this.getStoredUserId();
    if (!id) throw new Error('User not available');
    return this.request(`/users/${encodeURIComponent(id)}/stats`);
  }

  async getUserAchievements(userId) {
    const id = userId || this.getStoredUserId();
    if (!id) throw new Error('User not available');
    return this.request(`/users/${encodeURIComponent(id)}/achievements`);
  }

  async getUserGames(userId) {
    const id = userId || this.getStoredUserId();
    if (!id) throw new Error('User not available');
    return this.request(`/users/${encodeURIComponent(id)}/games`);
  }

  async postSessionSeconds(userId, seconds) {
    const id = userId || this.getStoredUserId();
    if (!id) throw new Error('User not available');
    return this.request(`/users/${encodeURIComponent(id)}/session`, {
      method: 'POST',
      body: JSON.stringify({ seconds }),
    });
  }

  async toggleFavoriteGame(userId, gameId, action = 'add') {
    const id = userId || this.getStoredUserId();
    if (!id) throw new Error('User not available');
    return this.request(`/users/${encodeURIComponent(id)}/favorites`, {
      method: 'PATCH',
      body: JSON.stringify({ gameId, action }),
    });
  }

  async getLastPosts(userId) {
    const id = userId || this.getStoredUserId();
    if (!id) throw new Error('User not available');
    return this.request(`/users/${encodeURIComponent(id)}/last-posts`);
  }

  // Games
  async getGames() {
    const url = '/games';
    const payload = await this.request(url);

    // store recent responses for debugging (exposed to window for the debug overlay)
    try {
      if (!this.lastResponses) this.lastResponses = [];
      const snippet = JSON.stringify(payload || {}).slice(0, 800);
      this.lastResponses.unshift({ url: resolveApiBaseForRuntime() + url, ok: !!payload, length: (payload && payload.games && payload.games.length) || (Array.isArray(payload) ? payload.length : 0), snippet, ts: Date.now() });
      this.lastResponses = this.lastResponses.slice(0, 8);
      try { window.__RETROHUB_LAST_RESPONSES = this.lastResponses; } catch (e) {}
    } catch (e) {}

    return payload;
  }

  async getGame(id) {
    return this.request(`/games/${encodeURIComponent(id)}`);
  }

  async getGameFull(id) {
    // Full game payload can be heavier (tips, faqs, media); allow more time before timing out
    return this.request(`/games/${encodeURIComponent(id)}/full`, {}, { timeout: 20000, retries: 2 });
  }

  async getTips(gameId) {
    return this.request(`/games/${encodeURIComponent(gameId)}/tips`);
  }

  async getFaqs(gameId) {
    return this.request(`/games/${encodeURIComponent(gameId)}/faqs`);
  }

  // Admin - users & moderators
  async getAdminUsers(query = '') {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    return this.request(`/admin/users?${params.toString()}`);
  }

  async getGameMods(gameId) {
    return this.request(`/admin/games/${encodeURIComponent(gameId)}/mods`);
  }

  async addGameMod(gameId, identifier) {
    const payload = {};
    if (identifier?.includes('@')) {
      payload.email = identifier;
    } else {
      payload.username = identifier;
    }
    return this.request(`/admin/games/${encodeURIComponent(gameId)}/mods`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async removeGameMod(gameId, userId) {
    return this.request(`/admin/games/${encodeURIComponent(gameId)}/mods/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  }

  // Community
  async getPosts(gameId) {
    return this.request(`/community/games/${encodeURIComponent(gameId)}/posts`);
  }

  async createPost(gameId, content) {
    return this.request(`/community/games/${encodeURIComponent(gameId)}/posts`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async togglePostSpoiler(postId, isSpoiler) {
    return this.request(`/community/posts/${encodeURIComponent(postId)}/spoiler`, {
      method: 'PATCH',
      body: JSON.stringify({ isSpoiler }),
    });
  }

  async deletePost(postId) {
    return this.request(`/community/posts/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    });
  }

  async createReply(postId, content) {
    return this.request(`/community/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async votePost(postId, direction = 'up') {
    if (!postId) throw new Error('postId required');
    // allow clearing a vote with 'none' (UI sends 'none' to unvote)
    if (direction !== 'up' && direction !== 'down' && direction !== 'none') throw new Error('invalid direction');
    return this.request(`/community/posts/${encodeURIComponent(postId)}/vote`, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    });
  }

  // AI Chat
  async chatInit(gameInfo = {}) {
    return this.request('/chat/init', {
      method: 'POST',
      body: JSON.stringify(gameInfo),
    });
  }

  async chatSelectCharacter(payload = {}) {
    return this.request('/chat/select-character', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async chatMessage(payload = {}) {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Admin
  async createGame(gameData) {
    return this.request('/admin/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  async updateGame(id, gameData) {
    return this.request(`/admin/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gameData),
    });
  }

  async deleteGame(id) {
    return this.request(`/admin/games/${id}`, {
      method: 'DELETE',
    });
  }

  async getGameMods(gameId) {
    return this.request(`/admin/games/${gameId}/mods`);
  }

  async addGameMod(gameId, userId) {
    return this.request(`/admin/games/${gameId}/mods`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async removeGameMod(gameId, userId) {
    return this.request(`/admin/games/${gameId}/mods/${userId}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
