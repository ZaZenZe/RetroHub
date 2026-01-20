// API Service Layer
const API_BASE = import.meta.env.VITE_API_BASE || '/api';
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

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
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

      try {
        const response = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers: { ...headers, ...options.headers },
          signal: controller.signal,
        });

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
        if (err.name === 'AbortError') {
          err.message = 'Request timeout';
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

  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // User
  async getUser() {
    return this.request('/users/me');
  }

  async updateUser(data) {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updatePassword(oldPassword, newPassword) {
    return this.request('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async getUserStats() {
    return this.request('/users/me/stats');
  }

  async getUserAchievements() {
    return this.request('/users/me/achievements');
  }

  async getUserGames() {
    return this.request('/users/me/games');
  }

  // Games
  async getGames() {
    return this.request('/games');
  }

  async getGame(id) {
    return this.request(`/games/${encodeURIComponent(id)}`);
  }

  async getGameFull(id) {
    return this.request(`/games/${encodeURIComponent(id)}/full`);
  }

  async getTips(gameId) {
    return this.request(`/games/${encodeURIComponent(gameId)}/tips`);
  }

  async getFaqs(gameId) {
    return this.request(`/games/${encodeURIComponent(gameId)}/faqs`);
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

  async createReply(postId, content) {
    return this.request(`/community/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // AI Chat
  async chat(message, gameContext = null, gameId = null) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, gameContext, gameId }),
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
