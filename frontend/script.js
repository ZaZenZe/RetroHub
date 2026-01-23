document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const $ = sel => document.querySelector(sel);
  const homeView = $('#home-view');
  const gameView = $('#game-view');
  const aboutView = $('#about-view');
  const mainNav = document.querySelector('.main-nav');
  const navBackdrop = document.querySelector('.nav-backdrop');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = Array.from(document.querySelectorAll('.nav-link[data-link]'));
  const adminLink = document.getElementById('admin-link');
  const grid = $('#game-grid');
  const backBtn = $('#back-btn');
  const gameTitle = $('#game-title');
  const gameArt = $('#game-art');
  const gamePlatform = $('#game-platform');
  const gameYear = $('#game-year');
  const gameDescription = $('#game-description');
  const tipsList = $('#tips-list');
  const faqList = $('#faq-list');
  const openChat = $('#open-chat');
  const scrollForum = $('#scroll-forum');
  const forumEl = $('#forum');
  const postsEl = $('#posts');
  const postForm = $('#post-form');
  const postText = $('#post-text');
  // Screenshots panel
  const shotsStrip = document.getElementById('shots-strip');
  const shotModal = document.getElementById('shot-modal');
  const shotModalImg = document.getElementById('shot-modal-image');
  const shotDownload = document.getElementById('shot-download');
  const shotPrev = document.getElementById('shot-prev');
  const shotNext = document.getElementById('shot-next');
  const shotModalContent = shotModal ? shotModal.querySelector('.map-modal-content') : null;
  const shotState = { items: [], index: 0 };
  const SWIPE_THRESHOLD = 40;

  const isShotModalOpen = () => shotModal?.getAttribute('aria-hidden') === 'false';

  function updateShotNavState() {
    const disabled = shotState.items.length <= 1;
    if (shotPrev) shotPrev.disabled = disabled;
    if (shotNext) shotNext.disabled = disabled;
  }

  function showShot(index) {
    if (!shotModalImg || !shotState.items.length) return;
    shotState.index = (index + shotState.items.length) % shotState.items.length;
    const shot = shotState.items[shotState.index];
    const alt = shot.alt || 'Screenshot full view';
    shotModalImg.src = shot.url;
    shotModalImg.alt = alt;
    if (shotDownload) {
      shotDownload.href = shot.url;
      const filename = shot.filename || (shot.url ? shot.url.split('/').pop() : 'retrohub-shot');
      if (filename) {
        shotDownload.setAttribute('download', filename);
      } else {
        shotDownload.removeAttribute('download');
      }
    }
    updateShotNavState();
  }

  function openShotModalAt(index = 0) {
    if (!shotModal || !shotState.items.length) return;
    showShot(index);
    shotModal.setAttribute('aria-hidden', 'false');
  }

  function closeShotModal() {
    if (!shotModal) return;
    shotModal.setAttribute('aria-hidden', 'true');
  }

  function changeShot(delta) {
    if (!shotState.items.length) return;
    showShot(shotState.index + delta);
  }

  shotPrev?.addEventListener('click', () => changeShot(-1));
  shotNext?.addEventListener('click', () => changeShot(1));
  shotModal
    ?.querySelectorAll('[data-close-shot]')
    ?.forEach(el => el.addEventListener('click', closeShotModal));
  window.addEventListener('keydown', ev => {
    if (!isShotModalOpen()) return;
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      changeShot(1);
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      changeShot(-1);
    } else if (ev.key === 'Escape') {
      closeShotModal();
    }
  });

  let swipeStartX = null;
  shotModalContent?.addEventListener('pointerdown', e => {
    swipeStartX = e.clientX;
  });
  shotModalContent?.addEventListener('pointerup', e => {
    if (swipeStartX === null) return;
    const deltaX = e.clientX - swipeStartX;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      changeShot(deltaX < 0 ? 1 : -1);
    }
    swipeStartX = null;
  });
  shotModalContent?.addEventListener('pointercancel', () => {
    swipeStartX = null;
  });
  // Home filters and states
  const filterPlatform = document.getElementById('filter-platform');
  const filterYear = document.getElementById('filter-year');
  const filterSearch = document.getElementById('filter-search');
  const filterReset = document.getElementById('filter-reset');
  const homeEmpty = document.getElementById('home-empty');
  const homeLoading = document.getElementById('home-loading');

  // Profile + Settings
  const profileView = document.getElementById('profile-view');
  const profileAvatar = document.getElementById('profile-avatar');
  const profileTagline = document.getElementById('profile-tagline');
  const profileTags = document.getElementById('profile-tags');
  const profileStats = document.getElementById('profile-stats');
  const collectionGrid = document.getElementById('collection-grid');
  const collectionFilter = document.getElementById('collection-filter');
  const achievementsGrid = document.getElementById('achievements-grid');

  const settingsView = document.getElementById('settings-view');
  const settingsName = document.getElementById('settings-name');
  const settingsEmail = document.getElementById('settings-email');
  const prefChat = document.getElementById('pref-chat');
  const prefBadge = document.getElementById('pref-badge');
  const prefAnalytics = document.getElementById('pref-analytics');

  // Chatbot elements
  const chatbotToggler = document.querySelector('.chatbot-toggler');
  const chatbotPanel = document.querySelector('.chatbot');
  const closeBtn = document.querySelector('.close-btn');
  const chatbox = document.querySelector('.chatbox');
  const chatInput = document.querySelector('.chat-input textarea');
  const sendChatBtn = document.querySelector('#send-btn');
  const chatSubtitle = document.querySelector('#chat-subtitle');
  // Auth elements
  const authBtn = document.getElementById('auth-btn');
  const authChip = document.getElementById('auth-chip');
  const authModal = document.getElementById('auth-modal');
  const authTabs = authModal ? Array.from(authModal.querySelectorAll('[data-auth-tab]')) : [];
  const authForms = {
    login: document.getElementById('auth-form-login'),
    register: document.getElementById('auth-form-register'),
  };
  const authEmail = document.getElementById('auth-email');
  const authPass = document.getElementById('auth-pass');
  const authNameReg = document.getElementById('auth-name');
  const authEmailReg = document.getElementById('auth-email-register');
  const authPassReg = document.getElementById('auth-pass-register');
  // Header GIF slot configuration (random pixel GIF on the right side)
  const headerEl = document.querySelector('.app-header');
  const logoHome = document.querySelector('.logo-home');
  const logoInner = document.querySelector('.logo-inner');
  const pixelGifs = [
    'assets/pixel/12c6a260613c6e51b16af016dd38c44e182fcd68_hq.gif',
    'assets/pixel/36541a1369a2eec1894ebff1b9e4a948a78cea80_hq.gif',
    'assets/pixel/3c06599306cca1e170ce8df10949cf91.gif',
    'assets/pixel/4efee18cb06f3d2f8456a40d1e0460e7.gif',
    'assets/pixel/6e7ebe7e86da8cb09f07c765f73efb29b8c0a97d_hq.gif',
    'assets/pixel/6Vww.gif',
    'assets/pixel/b695b53cae18d460881f51b037977b5b1cc261e9_hq.gif',
    'assets/pixel/bdb1f2848d8546d50e82c4ffd43b786f.gif',
    'assets/pixel/c740eb46064c338fc67c219b3df8792c0719ac38_hq.gif',
    'assets/pixel/e938d18fc07a3ffd16b4864ef2f1308f.gif',
  ];
  let headerGifHost = null;
  let headerGifImg = null;
  let lastGifIndex = -1;
  const DEFAULT_LOGO = 'assets/pokeball.png';

  function ensureHeaderGifHost() {
    if (!logoHome) return null;
    headerGifHost = logoHome;
    headerGifImg = logoHome;
    return headerGifHost;
  }
  function pickNewGifIndex() {
    if (pixelGifs.length === 0) return -1;
    let idx = Math.floor(Math.random() * pixelGifs.length);
    if (pixelGifs.length > 1 && idx === lastGifIndex) {
      idx = (idx + 1) % pixelGifs.length;
    }
    lastGifIndex = idx;
    return idx;
  }
  function setHeaderGifVisible(visible) {
    const host = ensureHeaderGifHost();
    if (!host) return;
    if (!visible) {
      host.src = DEFAULT_LOGO;
      if (logoInner) logoInner.src = DEFAULT_LOGO;
      return;
    }
    const idx = pickNewGifIndex();
    if (idx >= 0) {
      const src = pixelGifs[idx];
      headerGifImg.src = src;
      if (logoInner) logoInner.src = src;
    }
  }

  // AI service API (proxied by gateway)
  const API_URL = '/api/chat';
  const API_BASE = '/api';
  // Chat avatars
  const AVATAR_DEFAULT = 'assets/pokeball.png';
  const AVATAR_MALE = 'assets/pixel/male.jpg';
  const AVATAR_FEMALE = 'assets/pixel/female.jpg';
  const ASSISTANT_CHOICES = [
    { name: 'Retro Rick', gender: 'male', avatar: AVATAR_MALE, vibe: 'Arcade tactician' },
    { name: 'Retro Rose', gender: 'female', avatar: AVATAR_FEMALE, vibe: 'Cozy lore keeper' },
  ];
  const NO_INFO_LINE = "It's dangerous to go alone! No info yet.";
  const textOrFallback = (value, fallback = NO_INFO_LINE) => {
    const str = (value ?? '').toString().trim();
    return str ? str : fallback;
  };
  // Demo auth state (token + user)
  let authToken = localStorage.getItem('authToken') || '';
  let authUser = null;
  try {
    authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch {
    authUser = null;
  }

  function setAuth(user, token) {
    authUser = user || null;
    authToken = token || '';
    if (authUser && authToken) {
      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('authToken', authToken);
    } else {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    }
    updateAuthUI();
  }

  function updateAuthUI() {
    if (!authBtn) return;
    authBtn.textContent = authUser ? 'Signout' : 'Sign in';
    if (adminLink) {
      const role = authUser?.role || 'user';
      if (role === 'admin') {
        adminLink.textContent = 'Admin';
        adminLink.style.display = '';
      } else if (role === 'mod') {
        adminLink.textContent = 'Moderator';
        adminLink.style.display = '';
      } else {
        adminLink.style.display = 'none';
      }
    }
    if (authChip) {
      if (authUser) {
        authChip.textContent = `Hey, ${authUser.name || authUser.email}`;
        authChip.style.display = '';
      } else {
        authChip.style.display = 'none';
      }
    }
  }

  function setAuthTab(tab) {
    authTabs.forEach(btn => {
      const active = btn.dataset.authTab === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    Object.entries(authForms).forEach(([key, form]) => {
      if (!form) return;
      const active = key === tab;
      form.style.display = active ? 'grid' : 'none';
      form.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  }

  const isAuthModalOpen = () => authModal?.getAttribute('aria-hidden') === 'false';

  function openAuthModal() {
    if (authModal) authModal.setAttribute('aria-hidden', 'false');
    setAuthTab('login');
  }
  function closeAuthModal() {
    if (authModal) authModal.setAttribute('aria-hidden', 'true');
  }
  // API helpers
  async function apiJson(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    };
    const resp = await fetch(path, { ...options, headers });
    let payload = null;
    try {
      payload = await resp.json();
    } catch {
      payload = null;
    }
    if (!resp.ok) {
      const err = new Error((payload && payload.error) || resp.statusText || 'Request failed');
      err.status = resp.status;
      err.payload = payload;
      throw err;
    }
    return payload || {};
  }

  // App State (API-driven only)
  let games = [];
  let gamesLoadedFromApi = false;
  const gamesById = new Map();
  const gamesByDbId = new Map();
  const tipsCache = new Map();
  const faqCache = new Map();
  const postsCache = new Map();
  let currentGameId = null; // route key (slug)
  let currentGameDbId = null; // ObjectId for API calls

  function indexGame(game) {
    if (!game) return;
    const routeKey = game.slug || game.id || game.dbId;
    if (routeKey) gamesById.set(routeKey, game);
    if (game.dbId) gamesByDbId.set(game.dbId, game);
  }

  function syncGameIndex() {
    gamesById.clear();
    gamesByDbId.clear();
    games.forEach(indexGame);
  }
  syncGameIndex();

  // Profile state (hydrated from API)
  const profileState = {
    user: null,
    stats: null,
    achievements: [],
    games: [],
  };

  async function fetchProfileBundle() {
    if (!authUser || !authUser.id) return null;
    const userId = authUser.id || authUser._id || authUser.sub;
    const [userRes, statsRes, achRes, gamesRes] = await Promise.all([
      apiJson(`/api/users/${userId}`),
      apiJson(`/api/users/${userId}/stats`),
      apiJson(`/api/users/${userId}/achievements`),
      apiJson(`/api/users/${userId}/games`),
    ]);
    profileState.user = userRes?.user || null;
    profileState.stats = statsRes?.stats || null;
    profileState.achievements = Array.isArray(achRes?.achievements) ? achRes.achievements : [];
    profileState.games = Array.isArray(gamesRes?.games)
      ? gamesRes.games.map(entry => {
          const g = entry.gameId || {};
          return {
            id: g.slug || g._id || g.id,
            dbId: g._id || g.id,
            title: g.title,
            platform: g.platform,
            art: g.coverImageUrl,
            status: entry.status,
            progress: entry.progressPercentage,
          };
        })
      : [];
    return profileState;
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  }

  function mapApiGame(g) {
    if (!g) return null;
    const dbId = g.id || g._id;
    const slug = g.slug || dbId;
    return {
      id: slug, // used for routing/hash
      slug,
      dbId,
      title: g.title,
      platform: g.platform,
      year: g.releaseYear || g.year,
      version: g.versionLabel || g.region || 'Retro',
      art: g.coverImageUrl,
      banner: g.gameplayGifUrl || g.heroImageUrl || g.coverImageUrl,
      hover: g.coverGifUrl || g.hoverGifUrl || g.hoverImageUrl || g.coverImageUrl,
      description: g.description,
      screenshots: Array.isArray(g.screenshots) ? g.screenshots : [],
      theme: g.theme,
    };
  }

  async function loadGamesFromApi() {
    try {
      const data = await fetchJson(`${API_BASE}/games`);
      const mapped = (data?.games || []).map(mapApiGame).filter(Boolean);
      games = mapped;
      syncGameIndex();
    } catch {
      console.warn('Using fallback games; API unavailable');
    } finally {
      gamesLoadedFromApi = true;
    }
  }

  async function fetchGameFull(id) {
    try {
      const data = await fetchJson(`${API_BASE}/games/${encodeURIComponent(id)}/full`);
      const g = mapApiGame(data?.game);
      const tips = (data?.tips || []).map(t => t.content || t).filter(Boolean);
      const faqs = (data?.faqs || []).map(f => ({ q: f.question, a: f.answer })).filter(Boolean);
      if (g) {
        if (tips.length) g.tips = tips;
        if (faqs.length) g.faq = faqs;
        if (tips.length) tipsCache.set(g.dbId || g.id, tips);
        if (faqs.length) faqCache.set(g.dbId || g.id, faqs);
      }
      return g;
    } catch {
      return null;
    }
  }

  const api = {
    getGames: () => apiJson('/api/games'),
    getGame: id => apiJson(`/api/games/${id}`),
    getTips: id => apiJson(`/api/games/${id}/tips`),
    getFaqs: id => apiJson(`/api/games/${id}/faqs`),
    getPosts: gameId => apiJson(`/api/community/games/${gameId}/posts`),
    createPost: (gameId, content) =>
      apiJson(`/api/community/games/${gameId}/posts`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    getReplies: postId => apiJson(`/api/community/posts/${postId}/replies`),
    createReply: (postId, content) =>
      apiJson(`/api/community/posts/${postId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    validate: () => apiJson('/api/auth/me'),
  };

  let gamesLoadPromise = null;
  async function ensureGamesLoaded() {
    if (games && games.length) return games;
    if (!gamesLoadPromise) {
      gamesLoadPromise = loadGamesFromApi().catch(err => {
        gamesLoadPromise = null;
        throw err;
      });
    }
    await gamesLoadPromise;
    return games;
  }

  async function loadTips(gameDbId) {
    if (tipsCache.has(gameDbId)) return tipsCache.get(gameDbId);
    const { tips = [] } = await api.getTips(gameDbId);
    tipsCache.set(gameDbId, tips);
    return tips;
  }

  async function loadFaqs(gameDbId) {
    if (faqCache.has(gameDbId)) return faqCache.get(gameDbId);
    const { faqs = [] } = await api.getFaqs(gameDbId);
    faqCache.set(gameDbId, faqs);
    return faqs;
  }

  async function loadPosts(gameDbId) {
    if (postsCache.has(gameDbId)) return postsCache.get(gameDbId);
    const { posts = [] } = await api.getPosts(gameDbId);
    postsCache.set(gameDbId, posts);
    return posts;
  }

  // Neutral welcome messages (no hardcoded game/IP flavor)
  const welcomePool = {
    generic: [
      'Hey there! I’m your RetroHub gaming companion. Open the chat to pick who you want to talk to.',
      'Welcome! I can help with any game here. Tap the AI chat to get tips or walkthroughs.',
      'Let\'s get this nostalgia party started! Pick a guide to help you out.',
    ],
  };

  function randomWelcome(gameId, gameTitle) {
    if (gameTitle) {
      const tailored = [
        `Ready to conquer ${gameTitle}?`,
        `Let's make ${gameTitle} legendary.`,
        `${gameTitle} awaits—pick your guide!`,
      ];
      return tailored[Math.floor(Math.random() * tailored.length)];
    }
    const arr = welcomePool[gameId] || welcomePool.generic;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function resetChatWithWelcome(gameId, gameTitle) {
    currentCharacter = null;
    chatSessionPrimed = false;
    selectionPending = false;
    initMessageShown = false;
    if (pendingChoiceLi) {
      pendingChoiceLi.remove();
      pendingChoiceLi = null;
    }
    chatbox.innerHTML = '';
    const greeting = randomWelcome(gameId, gameTitle);
    const li = document.createElement('li');
    li.className = 'chat incoming';
    li.innerHTML = `<img src="${AVATAR_DEFAULT}" alt="RetroHub" class="chat-avatar" /><p>${greeting}</p>`;
    chatbox.appendChild(li);
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }

  // Ensure we start at the top after each route change
  function resetScrollTop() {
    // Do it on next frame to allow layout to settle
    requestAnimationFrame(() => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, 0);
      }
      document.body.scrollTop = 0; // Safari/iOS fallback
      document.documentElement.scrollTop = 0; // Cross-browser
    });
  }

  // Map gameId -> correct GIF path based on actual assets folder structure
  const gameGifMap = {
    'pokemon-fire-red': 'assets/game/fire-red.gif',
    'pokemon-emerald': 'assets/game/pokemon-emerald.gif',
    'pokemon-heart-gold': 'assets/game/heart-gold.gif',
    'pokemon-platinum': 'assets/game/platinum.gif',
    'pokemon-black-2': 'assets/game/black2.gif',
    'pokemon-y': 'assets/game/y.gif',
  };

  // New: gameplay GIFs for the hero area (inside pages)
  const gameplayGifMap = {
    'pokemon-fire-red': 'assets/gameplay/pokemon-fire-red.gif',
    'pokemon-emerald': 'assets/gameplay/emerald.gif',
    'pokemon-heart-gold': 'assets/gameplay/heartgold.gif',
    'pokemon-platinum': 'assets/gameplay/platinum.gif',
    'pokemon-black-2': 'assets/gameplay/black2.gif',
    'pokemon-y': 'assets/gameplay/y.gif',
  };

  function setHomeLoading(isLoading) {
    if (!homeLoading) return;
    homeLoading.style.display = isLoading ? 'grid' : 'none';
    homeLoading.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
  }

  const clearThemes = () => {
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    // Remove any dynamic CSS variables
    const dynamicStyle = document.getElementById('dynamic-theme-style');
    if (dynamicStyle) dynamicStyle.remove();
  };

  function applyDynamicTheme(theme) {
    if (!theme || typeof theme !== 'object') return;
    
    // If theme is just a string (old format), use static theme classes
    if (typeof theme === 'string') {
      clearThemes();
      document.body.classList.add(`theme-${theme}`);
      return;
    }
    
    // Reset any previous theme classes/styles before applying new dynamic tokens
    clearThemes();

    // Apply dynamic colors from theme.colors
    const colors = theme.colors || {};
    const themeName = theme.name || 'retro';

    const primary = colors.primary || '#ff7b00';
    const primaryAlt = colors.primaryAlt || colors.primary || '#ff9f1a';
    const accent = colors.accent || primaryAlt;
    const background = colors.background || '#0d0e12';
    const bgElev1 = colors.bgElev1 || background;
    const bgElev2 = colors.bgElev2 || background;
    const card = colors.card || background;
    const text = colors.text || '#e6e6e9';
    const muted = colors.muted || '#b3bac4';
    const border = colors.border || '#232734';
    const ring = colors.ring || 'rgba(255,155,40,0.45)';
    const shadow = colors.shadow || '0 8px 28px rgba(0,0,0,0.45)';
    const headerFrom = colors.headerFrom || background;
    const headerTo = colors.headerTo || background;
    
    // Create or update dynamic style element
    let dynamicStyle = document.getElementById('dynamic-theme-style');
    if (!dynamicStyle) {
      dynamicStyle = document.createElement('style');
      dynamicStyle.id = 'dynamic-theme-style';
      document.head.appendChild(dynamicStyle);
    }
    
    // Generate CSS with theme colors
    const css = `
      :root {
        --primary: ${primary};
        --primary-2: ${primaryAlt};
        --accent: ${accent};
        --bg: ${background};
        --bg-elev-1: ${bgElev1};
        --bg-elev-2: ${bgElev2};
        --card: ${card};
        --text: ${text};
        --muted: ${muted};
        --border: ${border};
        --ring: ${ring};
        --shadow: ${shadow};
        --header-from: ${headerFrom};
        --header-to: ${headerTo};
      }
    `;
    
    dynamicStyle.textContent = css;
    
    // Add theme class for additional styling hooks
    document.body.classList.add(`theme-${themeName}`);
  }
  function openNav() {
    document.body.classList.add('nav-open');
  }
  function closeNav() {
    document.body.classList.remove('nav-open');
  }
  function toggleNav() {
    if (document.body.classList.contains('nav-open')) closeNav();
    else openNav();
  }

  function filterGameList(list) {
    const platform = (filterPlatform?.value || '').toLowerCase();
    const year = filterYear?.value || '';
    const term = (filterSearch?.value || '').toLowerCase().trim();
    return list.filter(g => {
      const platformMatch = platform ? (g.platform || '').toLowerCase().includes(platform) : true;
      const yearMatch = year ? (g.year || '').toString() === year : true;
      const text = `${g.title || ''} ${g.platform || ''} ${g.version || ''}`.toLowerCase();
      const searchMatch = term ? text.includes(term) : true;
      return platformMatch && yearMatch && searchMatch;
    });
  }

  // Render Home Grid
  async function renderHome() {
    if (homeEmpty) homeEmpty.hidden = true;
    grid.innerHTML = '';
    setHomeLoading(true);
    if (!gamesLoadedFromApi) {
      await loadGamesFromApi();
    }
    setHomeLoading(false);
    // Theme: Home (light red/white)
    clearThemes();
    document.body.classList.add('theme-home');
    // Reset chatbot with generic welcome on Home
    resetChatWithWelcome(null, null);
    if (chatSubtitle) {
      chatSubtitle.textContent = 'Ask about any retro game.';
    }
    const filtered = filterGameList(games);
    if (!filtered.length) {
      if (homeEmpty) homeEmpty.hidden = false;
      return;
    }
    filtered.forEach(g => {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('role', 'listitem');
      const thumbStyle = g.art ? `style="background-image:url('${g.art}')"` : '';
      const platformClass = (g.platform || '').toLowerCase().includes('3ds')
        ? 'threeds'
        : (g.platform || '').toLowerCase().includes('gba')
          ? 'gba'
          : (g.platform || '').toLowerCase().includes('ds')
            ? 'ds'
            : '';
      card.innerHTML = `
        <div class="thumb" ${thumbStyle}></div>
        <div class="body">
          <div class="title">${g.title}</div>
          <div class="chips">
            <span class="chip chip-platform ${platformClass}">${g.platform}</span>
            <span class="chip">${g.year || 'TBA'}</span>
          </div>
          <button class="cta" data-open="${g.id}">Open</button>
        </div>
      `;
      card.tabIndex = 0;
      // Hover GIF preview per game (Home only)
      const thumb = card.querySelector('.thumb');
      const originalUrl = g.art || '';
      const gifUrl = g.hover || gameGifMap[g.id] || '';
      let hoverToken = 0;
      const applyBg = url => {
        thumb.style.backgroundImage = url ? `url('${url}')` : '';
      };
      card.addEventListener('pointerenter', () => {
        hoverToken += 1;
        const token = hoverToken;
        if (!gifUrl) return;
        const img = new Image();
        img.onload = () => {
          if (token === hoverToken) applyBg(gifUrl);
        };
        img.onerror = () => {
          /* keep original if missing */
        };
        img.src = gifUrl;
      });
      card.addEventListener('pointerleave', () => {
        hoverToken += 1;
        applyBg(originalUrl);
      });
      // Keyboard accessibility: focus shows preview; blur restores
      card.addEventListener('focusin', () => {
        if (!gifUrl) return;
        const img = new Image();
        img.onload = () => applyBg(gifUrl);
        img.src = gifUrl;
      });
      card.addEventListener('focusout', () => applyBg(originalUrl));
      const openDetail = () => navigateTo(`#/${g.slug || g.id}`);
      card.addEventListener('click', e => {
        if (e.target.closest('[data-open]')) return;
        openDetail();
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      });
      card.querySelector('[data-open]')?.addEventListener('click', openDetail);
      grid.appendChild(card);
    });
  }

  // Render Game Detail
  async function renderGame(game) {
    currentGameId = game.slug || game.id;
    currentGameDbId = game.dbId || game.id;
    
    // Apply dynamic theme from game data
    if (game.theme) {
      applyDynamicTheme(game.theme);
    } else {
      // Fallback to platform-based theming (old behavior)
      const themeMapId = {
        'fire-red': 'theme-fire-red',
        emerald: 'theme-emerald',
        'heart-gold': 'theme-heart-gold',
        platinum: 'theme-platinum',
        'black-2': 'theme-black-2',
        y: 'theme-y',
      };
      const themeMapPlatform = {
        gba: 'theme-fire-red',
        ds: 'theme-platinum',
        '3ds': 'theme-y',
        snes: 'theme-emerald',
        playstation: 'theme-heart-gold',
      };
      const platformKey = (game.platform || '').toLowerCase();
      const themeClass =
        themeMapId[game.id] || themeMapId[game.slug] || themeMapPlatform[platformKey];
      clearThemes();
      document.body.classList.add(themeClass || 'theme-home');
    }

    gameTitle.textContent = game.title;
    // Prefer gameplay GIF if available, then banner, then art
    const heroUrl =
      gameplayGifMap[game.slug] ||
      gameplayGifMap[game.id] ||
      game.banner ||
      game.art ||
      game.coverImageUrl ||
      '';
    if (heroUrl) {
      gameArt.classList.remove('no-image');
      gameArt.style.backgroundImage = `url('${heroUrl}')`;
    } else {
      gameArt.style.backgroundImage = '';
      gameArt.classList.add('no-image');
    }
    gamePlatform.textContent = textOrFallback(game.platform, 'Platform TBA');
    gameYear.textContent = textOrFallback(game.year, 'Year TBA');
    gameDescription.textContent = textOrFallback(game.description);
    chatSubtitle.textContent = `Chatting about: ${game.title}`;
    // Reset chatbot with a per-game randomized welcome
    resetChatWithWelcome(game.slug || game.id, game.title);

    // Additional Screenshots (temporary: reuse region map image until backend provides real screenshots)
    const screenshots = (() => {
      const fromGame = Array.isArray(game.screenshots)
        ? game.screenshots
            .map(s => (typeof s === 'string' ? { url: s, alt: `${game.title} screenshot` } : s))
            .filter(s => s && s.url)
        : [];
      if (fromGame.length) return fromGame;
      const fallbacks = [];
      if (game.banner) fallbacks.push({ url: game.banner, alt: `${game.title} map` });
      if (game.art) fallbacks.push({ url: game.art, alt: `${game.title} cover` });
      return fallbacks;
    })();
    shotState.items = screenshots;
    shotState.index = 0;
    updateShotNavState();
    if (shotsStrip) {
      shotsStrip.innerHTML = '';
      const shotsPanelHost = shotsStrip.closest('.panel');
      if (!screenshots.length) {
        if (shotsPanelHost) shotsPanelHost.style.display = 'none';
        closeShotModal();
      } else {
        if (shotsPanelHost) shotsPanelHost.style.display = '';
        screenshots.forEach((shot, idx) => {
          const item = document.createElement('button');
          item.className = 'shot-thumb';
          item.type = 'button';
          item.setAttribute('role', 'listitem');
          item.setAttribute('aria-label', shot.alt || `${game.title} screenshot ${idx + 1}`);
          item.innerHTML = `<img src="${shot.url}" alt="${shot.alt || `${game.title} screenshot ${idx + 1}`}" loading="lazy" />`;
          item.addEventListener('click', () => openShotModalAt(idx));
          shotsStrip.appendChild(item);
        });
      }
    }

    // Tips
    tipsList.innerHTML = '';
    const tips = Array.isArray(game.tips) && game.tips.length ? game.tips : [NO_INFO_LINE];
    tips.forEach(t => {
      const li = document.createElement('li');
      li.textContent = textOrFallback(t);
      tipsList.appendChild(li);
    });

    // FAQ
    faqList.innerHTML = '';
    const faqs = Array.isArray(game.faq) && game.faq.length ? game.faq : null;
    if (!faqs) {
      const empty = document.createElement('div');
      empty.className = 'map-hint';
      empty.textContent = NO_INFO_LINE;
      faqList.appendChild(empty);
    } else {
      faqs.forEach(({ q, a }) => {
        const d = document.createElement('details');
        const s = document.createElement('summary');
        s.textContent = textOrFallback(q, 'Question TBD');
        d.appendChild(s);
        const p = document.createElement('p');
        p.textContent = textOrFallback(a);
        d.appendChild(p);
        faqList.appendChild(d);
      });
    }

    // Forum posts
    await renderPosts();
  }

  async function renderPosts() {
    postsEl.innerHTML = '';
    const loading = document.createElement('li');
    loading.className = 'post';
    loading.innerHTML = '<div class="bubble"><div class="text">Loading posts…</div></div>';
    postsEl.appendChild(loading);
    if (!currentGameDbId) return;
    try {
      const posts = await loadPosts(currentGameDbId);
      postsEl.innerHTML = '';
      if (!posts.length) {
        const empty = document.createElement('li');
        empty.className = 'post';
        empty.innerHTML =
          '<div class="bubble"><div class="text">No posts yet. Be the first to share a tip or ask a question!</div></div>';
        postsEl.appendChild(empty);
        return;
      }
      posts.forEach(p => {
        const li = document.createElement('li');
        li.className = 'post';
        const author = (p.userId && (p.userId.username || p.userId.email)) || 'Member';
        const ts = p.createdAt ? new Date(p.createdAt).toLocaleString() : '';
        li.innerHTML = `
          <div class="meta"><span>${author}</span><span>•</span><span>${ts}</span></div>
          <div class="bubble"><div class="text"></div></div>
        `;
        li.querySelector('.text').textContent = p.content;
        postsEl.appendChild(li);
      });
    } catch (err) {
      postsEl.innerHTML = '';
      const errorLi = document.createElement('li');
      errorLi.className = 'post';
      const msg =
        err.status === 401
          ? 'Sign in to view posts for this game.'
          : 'Unable to load posts right now.';
      errorLi.innerHTML = `<div class="bubble"><div class="text">${msg}</div></div>`;
      postsEl.appendChild(errorLi);
      console.error(err);
    }
  }

  function buildCollection() {
    return games.map((g, idx) => ({
      ...g,
      status: ['Completed', 'In progress', 'Wishlist'][idx % 3],
      progress: 42 + ((idx * 13) % 55),
    }));
  }

  function renderCollectionGrid() {
    if (!collectionGrid) return;
    collectionGrid.innerHTML = '';
    const platform = (collectionFilter?.value || '').toLowerCase();
    const list = (profileState.games || []).filter(item =>
      platform ? (item.platform || '').toLowerCase().includes(platform) : true
    );
    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'map-hint';
      empty.textContent = 'No games in this filter yet.';
      collectionGrid.appendChild(empty);
      return;
    }
    list.forEach(item => {
      const card = document.createElement('article');
      card.className = 'collection-card';
      card.innerHTML = `
        <div class="thumb" style="background-image:url('${item.art || ''}')"></div>
        <div class="meta">
          <div class="title">${item.title}</div>
          <div class="chips">
            <span class="chip">${item.platform || 'TBA'}</span>
            <span class="chip">${item.status}</span>
          </div>
          <div class="progress" aria-label="${item.progress}% complete"><span style="width:${item.progress}%"></span></div>
        </div>
      `;
      collectionGrid.appendChild(card);
    });
  }

  function renderAchievements() {
    if (!achievementsGrid) return;
    achievementsGrid.innerHTML = '';
    if (!profileState.achievements.length) {
      const empty = document.createElement('p');
      empty.className = 'map-hint';
      empty.textContent = 'No achievements yet.';
      achievementsGrid.appendChild(empty);
      return;
    }
    profileState.achievements.forEach(a => {
      const card = document.createElement('div');
      card.className = 'achievement';
      card.innerHTML = `<h4>${a.name}</h4><p>${a.description}</p>`;
      achievementsGrid.appendChild(card);
    });
  }

  function renderProfile() {
    if (!profileView) return;
    if (!authUser) {
      profileView.querySelector('.panel')?.scrollIntoView({ behavior: 'auto', block: 'start' });
      profileAvatar.src = 'assets/pixel/6Vww.gif';
      profileTagline.textContent = 'Sign in to view your trainer card.';
      profileTags.innerHTML = '';
      profileStats.innerHTML = '<p class="map-hint">Please sign in first.</p>';
      collectionGrid.innerHTML = '<p class="map-hint">Sign in to see your collection.</p>';
      achievementsGrid.innerHTML = '<p class="map-hint">Sign in to see achievements.</p>';
      return;
    }
    if (profileState.user) {
      profileAvatar.src = profileState.user.avatarUrl || 'assets/pixel/6Vww.gif';
      profileTagline.textContent = profileState.user.username || 'Trainer';
      profileTags.innerHTML = '';
      const tags = [profileState.user.role === 'admin' ? 'Admin' : 'Member'];
      tags.forEach(t => {
        const c = document.createElement('span');
        c.className = 'chip';
        c.textContent = t;
        profileTags.appendChild(c);
      });
      profileStats.innerHTML = '';
      const statsList = [
        { label: 'Games tracked', value: profileState.stats?.totalGames ?? 0 },
        { label: 'Completed', value: profileState.stats?.completedGames ?? 0 },
        { label: 'Forum posts', value: profileState.stats?.forumPosts ?? 0 },
        { label: 'Forum replies', value: profileState.stats?.forumReplies ?? 0 },
      ];
      statsList.forEach(stat => {
        const s = document.createElement('div');
        s.className = 'stat';
        s.innerHTML = `<div class="label">${stat.label}</div><div class="value">${stat.value}</div>`;
        profileStats.appendChild(s);
      });
      renderCollectionGrid();
      renderAchievements();
    }
  }

  const SETTINGS_KEY = 'retrohub-settings';
  function hydrateSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (settingsName)
        settingsName.value = profileState.user?.username || stored.name || 'Trainer';
      if (settingsEmail) {
        settingsEmail.value = profileState.user?.email || authUser?.email || '';
        settingsEmail.readOnly = true; // backend does not expose email change yet
      }
      if (prefChat) prefChat.checked = stored.prefChat ?? true;
      if (prefBadge) prefBadge.checked = stored.prefBadge ?? true;
      if (prefAnalytics) prefAnalytics.checked = stored.prefAnalytics ?? false;
    } catch {
      /* ignore */
    }
  }
  function persistSettings() {
    const payload = {
      name: settingsName?.value || 'Trainer',
      email: settingsEmail?.value || '',
      prefChat: !!prefChat?.checked,
      prefBadge: !!prefBadge?.checked,
      prefAnalytics: !!prefAnalytics?.checked,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    alert('Your preferences have been saved locally');
  }

  // Forum submit
  postForm.addEventListener('submit', async e => {
    e.preventDefault();
    const text = postText.value.trim();
    if (!text || !currentGameDbId) return;
    if (!authToken) {
      promptSignInWithOak();
      return;
    }
    try {
      await api.createPost(currentGameDbId, text);
      postText.value = '';
      postsCache.delete(currentGameDbId);
      await renderPosts();
    } catch (err) {
      if (err.status === 401) {
        promptSignInWithOak();
        return;
      }
      alert(err.message || 'Could not publish post.');
    }
  });

  // Simple Router
  function navigateTo(hash) {
    window.location.hash = hash;
  }
  function go(path) {
    navigateTo(path.startsWith('#') ? path : `#${path}`);
    closeNav();
  }
  async function onRoute() {
    const hash = window.location.hash || '#/';
    const parts = hash.slice(2).split('/').filter(Boolean);
    const routeKey = (parts[0] || '').replace(/[#?].*$/, '').toLowerCase();
    // Update active nav link state
    const markActive = route => {
      document.querySelectorAll('.nav-link').forEach(a => {
        const href = a.getAttribute('href');
        const activeMatch =
          (route === 'home' && href === '#/') ||
          (route === 'about' && href === '#/about') ||
          (route === 'profile' && href === '#/profile') ||
          (route === 'settings' && href === '#/settings');
        if (activeMatch) {
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      });
    };

    try {
      await ensureGamesLoaded();
    } catch (err) {
      console.error('Failed to load games', err);
    }

    if (parts.length === 0) {
      aboutView.classList.remove('active');
      homeView.classList.add('active');
      gameView.classList.remove('active');
      profileView?.classList.remove('active');
      settingsView?.classList.remove('active');
      renderHome();
      markActive('home');
      // Show a random header gif on Home
      setHeaderGifVisible(true);
      resetScrollTop();
      closeNav();
    } else {
      const id = routeKey || parts[0];
      // About route: dedicated minimal page showing only the Meowth City GIF
      if (id === 'about') {
        homeView.classList.remove('active');
        gameView.classList.remove('active');
        aboutView.classList.add('active');
        profileView?.classList.remove('active');
        settingsView?.classList.remove('active');
        // Apply About theme tokens and ensure chatbot is closed
        clearThemes();
        document.body.classList.add('theme-about');
        document.body.classList.remove('show-chatbot');
        // Hide header gif on About
        setHeaderGifVisible(false);
        markActive('about');
        resetScrollTop();
        closeNav();
        return;
      }

      // Profile route
      if (id === 'profile') {
        homeView.classList.remove('active');
        gameView.classList.remove('active');
        aboutView.classList.remove('active');
        settingsView?.classList.remove('active');
        profileView?.classList.add('active');
        clearThemes();
        document.body.classList.add('theme-home');
        setHeaderGifVisible(true);
        if (authUser) {
          try {
            await fetchProfileBundle();
          } catch (err) {
            console.error('Failed to load profile', err);
          }
        }
        renderProfile();
        hydrateSettings();
        markActive('profile');
        if (!authToken && !authPromptShown) {
          promptSignInWithOak();
        }
        resetScrollTop();
        closeNav();
        return;
      }

      // Settings route
      if (id === 'settings') {
        homeView.classList.remove('active');
        gameView.classList.remove('active');
        aboutView.classList.remove('active');
        profileView?.classList.remove('active');
        settingsView?.classList.add('active');
        clearThemes();
        document.body.classList.add('theme-home');
        setHeaderGifVisible(true);
        if (authUser) {
          try {
            await fetchProfileBundle();
          } catch (err) {
            console.error('Failed to load profile for settings', err);
          }
        }
        hydrateSettings();
        markActive('settings');
        if (!authToken && !authPromptShown) {
          promptSignInWithOak();
        }
        resetScrollTop();
        closeNav();
        return;
      }
      const proceed = async () => {
        let game = games.find(g => g.slug === id || g.id === id || g.dbId === id);
        if (!game) {
          await loadGamesFromApi();
          game = games.find(g => g.slug === id || g.id === id || g.dbId === id);
        }
        if (!game) {
          const fetched = await fetchGameFull(id);
          if (fetched) {
            games.push(fetched);
            game = fetched;
            syncGameIndex();
          }
        }
        if (game) {
          aboutView.classList.remove('active');
          homeView.classList.remove('active');
          profileView?.classList.remove('active');
          settingsView?.classList.remove('active');
          gameView.classList.add('active');
          renderGame(game);
          // Hydrate richer data if available
          fetchGameFull(game.dbId || game.slug || game.id).then(full => {
            if (full) {
              Object.assign(game, full);
              syncGameIndex();
              renderGame(game);
            }
          });
          markActive('');
          setHeaderGifVisible(true);
          resetScrollTop();
        } else {
          navigateTo('#/');
        }
      };
      proceed();
    }
  }
  window.addEventListener('hashchange', () => onRoute().catch(console.error));

  // Back and Jump actions
  backBtn.addEventListener('click', () => go('#/'));
  openChat.addEventListener('click', async () => {
    document.body.classList.add('show-chatbot');
    if (!authToken && !authPromptShown) {
      promptSignIn();
    }
    try {
      await ensureChatSession();
    } catch (err) {
      const li = createChatLi(err.message || 'Unable to start chat.', 'incoming');
      chatbox.appendChild(li);
    }
    chatInput.focus();
  });
  menuToggle?.addEventListener('click', toggleNav);
  navBackdrop?.addEventListener('click', closeNav);
  document.addEventListener('click', e => {
    if (!document.body.classList.contains('nav-open')) return;
    if (mainNav && mainNav.contains(e.target)) return;
    if (menuToggle && menuToggle.contains(e.target)) return;
    closeNav();
  });

  navLinks.forEach(link => {
    link.addEventListener('click', evt => {
      const href = link.getAttribute('href') || '#/';
      if (!href.startsWith('#')) return;
      evt.preventDefault();
      go(href);
    });
  });
  scrollForum.addEventListener('click', () => {
    forumEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    postText?.focus({ preventScroll: true });
  });

  // Chatbot logic (RetroHub AI service)
  const inputInitHeight = chatInput.scrollHeight;
  let userMessage = '';
  let authPromptShown = false;
  let currentCharacter = null;
  let chatSessionPrimed = false;
  let selectionPending = false;
  let initMessageShown = false;
  let pendingChoiceLi = null;

  const normalizeCharacterAvatar = character => {
    if (!character) return null;
    const normalizedGender = character.gender === 'female' ? 'female' : 'male';
    character.gender = normalizedGender;
    if (!character.avatar) {
      character.avatar = normalizedGender === 'female' ? AVATAR_FEMALE : AVATAR_MALE;
    }
    return character;
  };

  const currentAvatar = () => {
    if (!currentCharacter) return AVATAR_DEFAULT;
    if (currentCharacter.avatar) return currentCharacter.avatar;
    if (currentCharacter.gender === 'female') return AVATAR_FEMALE;
    if (currentCharacter.gender === 'male') return AVATAR_MALE;
    return AVATAR_DEFAULT;
  };

  const createChatLi = (message, className) => {
    const chatLi = document.createElement('li');
    chatLi.classList.add('chat', className);
    chatLi.innerHTML =
      className === 'outgoing'
        ? `<p>${message}</p>`
        : `<img src="${currentAvatar()}" alt="RetroHub assistant" class="chat-avatar" /><p>${message}</p>`;
    return chatLi;
  };

  const promptSignInWithOak = promptSignIn; // legacy hook

  function promptSignIn(replaceEl) {
    const msg = 'Please sign in to use the AI companion.';
    if (replaceEl) {
      const p = replaceEl.querySelector('p');
      if (p) p.textContent = msg;
    } else if (!authPromptShown) {
      const incoming = createChatLi(msg, 'incoming');
      chatbox.appendChild(incoming);
      chatbox.scrollTo(0, chatbox.scrollHeight);
    }
    authPromptShown = true;
    openAuthModal();
    setTimeout(() => authEmail?.focus(), 50);
  }

  function appendIncomingMessage(text) {
    if (!text) return null;
    const li = createChatLi(text, 'incoming');
    chatbox.appendChild(li);
    chatbox.scrollTo(0, chatbox.scrollHeight);
    return li;
  }

  function getCurrentGameMeta() {
    const game =
      gamesById.get(currentGameId) ||
      gamesByDbId.get(currentGameDbId) ||
      games.find(g => g.id === currentGameId || g.dbId === currentGameDbId);
    return {
      gameName: game?.title || '',
      platform: game?.platform || '',
      releaseYear: game?.year || '',
      gameId: game?.dbId || game?._id || null,
    };
  }

  async function callJson(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload || {}),
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = null;
    }

    if (!res.ok) {
      // If the token is missing/expired/invalid, clear stale auth to avoid repeated 403s
      if (res.status === 401 || res.status === 403) {
        setAuth(null, '');
        authPromptShown = false;
      }
      const err = new Error((data && (data.error || data.message)) || res.statusText || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data || {};
  }

  async function handleCharacterChoice(choice, hostLi, meta, assistantName) {
    const buttons = hostLi?.querySelectorAll('button[data-choice]');
    buttons?.forEach(btn => (btn.disabled = true));
    try {
      const pick = await callJson(`${API_URL}/select-character`, {
        ...meta,
        choice,
        assistantName,
      });
      selectionPending = false;
      pendingChoiceLi = null;
      currentCharacter = normalizeCharacterAvatar(pick.character);

      if (pick.notice) {
        appendIncomingMessage(pick.notice);
      }
      if (choice === 'in-game' && pick.inGameAvailable === false) {
        appendIncomingMessage('Game not recognized by AI yet. Switching to RetroHub assistant.');
      }

      // Hard-coded post-selection lines for the two RetroHub assistants
      const personaIntros = {
        'Retro Rick': "Retro Rick here. Take a breath—I've got this. Tell me what's got you stuck and we'll figure it out together, nice and easy.",
        'Retro Rose': "Retro Rose here, sweetie. I'm in charge and you're going to love it. Tell me what you need... if you can keep up with me.",
      };

      const greeting = pick.character?.greeting;
      const isAssistantChoice = choice === 'assistant';
      const assistantIntro = isAssistantChoice && assistantName ? personaIntros[assistantName] : null;
      const characterName = pick.character?.name || 'your guide';
      const gameLabel = meta.gameName || 'this world';

      let finalGreeting = greeting;

      if (assistantIntro) {
        // Always show the hard-coded persona line for RetroHub assistants
        finalGreeting = assistantIntro;
      } else if (isAssistantChoice && greeting) {
        finalGreeting = greeting;
      } else if (isAssistantChoice) {
        finalGreeting = `I'm ${assistantName || 'your RetroHub guide'}. Tell me what you need and I will take it from here.`;
      } else if (choice === 'in-game') {
        finalGreeting = greeting || `${characterName} here from ${gameLabel}. Tell me what you need and I will handle it in my own style.`;
      }

      appendIncomingMessage(finalGreeting || 'Ready to help. What do you need?');
    } catch (err) {
      selectionPending = false;
      buttons?.forEach(btn => (btn.disabled = false));
      const li = appendIncomingMessage(err.message || 'Could not select a character. Try again.');
      if (li) li.classList.add('error');
      throw err;
    }
  }

  function renderCharacterChoice(meta, customText) {
    if (pendingChoiceLi) pendingChoiceLi.remove();
    const li = document.createElement('li');
    li.className = 'chat incoming';
    const text = customText || `Pick your guide for ${meta.gameName || 'this adventure'}:`;
    const assistantCards = ASSISTANT_CHOICES.map(
      a => `
        <button type="button" class="choice-card" data-choice="assistant" data-assistant-name="${a.name}">
          <img src="${a.avatar}" alt="${a.name}" class="choice-avatar" />
          <strong>${a.name}</strong>
        </button>`
    ).join('');

    li.innerHTML = `
      <img src="${AVATAR_DEFAULT}" alt="RetroHub" class="chat-avatar" />
      <div class="chat-choice">
        <p>${text}</p>
        <div class="chat-choice-grid">
          <button type="button" class="choice-card prominent" data-choice="in-game">
            <div class="choice-icon">🎮</div>
            <strong>In-Game</strong>
          </button>
          ${assistantCards}
        </div>
      </div>`;
    chatbox.appendChild(li);
    pendingChoiceLi = li;
    chatbox.scrollTo(0, chatbox.scrollHeight);
    li.querySelectorAll('button[data-choice]')?.forEach(btn => {
      btn.addEventListener('click', () => {
        handleCharacterChoice(btn.dataset.choice, li, meta, btn.dataset.assistantName).catch(err => console.error(err));
      });
    });
  }

  async function ensureChatSession() {
    if (selectionPending) return;
    if (chatSessionPrimed && currentCharacter) return;

    const meta = getCurrentGameMeta();
    const init = await callJson(`${API_URL}/init`, meta);
    chatSessionPrimed = true;

    if (init.needsCharacterSelection) {
      selectionPending = true;
      currentCharacter = null;
      renderCharacterChoice(meta, init.message);
      return;
    }

    if (init.message && !initMessageShown) {
      appendIncomingMessage(init.message);
      initMessageShown = true;
    }

    if (init.character) {
      currentCharacter = normalizeCharacterAvatar(init.character);
      const greeting = init.character.greeting || init.message;
      if (greeting && (!initMessageShown || greeting !== init.message)) {
        appendIncomingMessage(greeting);
        initMessageShown = true;
      }
    }
  }

  const generateResponse = async chatElement => {
    const meta = getCurrentGameMeta();
    const messageElement = chatElement.querySelector('p');
    try {
      if (selectionPending) {
        messageElement.textContent = 'Pick an in-game character or the RetroHub assistant to start.';
        return;
      }
      if (!currentCharacter) {
        await ensureChatSession();
      }
      if (selectionPending) {
        messageElement.textContent = 'Pick an in-game character or the RetroHub assistant to start.';
        return;
      }
      if (!currentCharacter) {
        messageElement.textContent = 'Choose a character to start chatting.';
        return;
      }
      const payload = {
        message: userMessage,
        character: currentCharacter,
        gameInfo: meta,
      };
      const data = await callJson(`${API_URL}/message`, payload);
      currentCharacter = normalizeCharacterAvatar(data.character || currentCharacter);
      messageElement.textContent = data.response || 'No response received. Try again.';
      try {
        chatElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        chatbox.scrollTop = Math.max(0, chatElement.offsetTop - 8);
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        promptSignIn(chatElement);
        return;
      }
      messageElement.classList.add('error');
      const hint = 'If you are running locally, ensure the AI service is running and GEMINI_API_KEY is set.';
      messageElement.textContent = (error.message || 'Error contacting AI service') + '\n' + hint;
      try {
        chatElement.scrollIntoView({ behavior: 'auto', block: 'start' });
      } catch {
        chatbox.scrollTop = Math.max(0, chatElement.offsetTop - 8);
      }
    }
  };

  async function handleChat() {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;
    if (selectionPending) {
      appendIncomingMessage('Choose an in-game character or the RetroHub assistant to start chatting.');
      chatInput.value = '';
      chatInput.style.height = `${inputInitHeight}px`;
      return;
    }
    if (!authToken) {
      chatInput.value = '';
      chatInput.style.height = `${inputInitHeight}px`;
      chatbox.appendChild(createChatLi(userMessage, 'outgoing'));
      chatbox.scrollTo(0, chatbox.scrollHeight);
      promptSignIn();
      return;
    }
    try {
      await ensureChatSession();
    } catch (err) {
      appendIncomingMessage(err.message || 'Unable to start the chat session.');
      chatInput.value = '';
      chatInput.style.height = `${inputInitHeight}px`;
      return;
    }
    if (selectionPending) {
      appendIncomingMessage('Choose an in-game character or the RetroHub assistant to start chatting.');
      chatInput.value = '';
      chatInput.style.height = `${inputInitHeight}px`;
      return;
    }
    chatInput.value = '';
    chatInput.style.height = `${inputInitHeight}px`;
    chatbox.appendChild(createChatLi(userMessage, 'outgoing'));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(async () => {
      const incomingChatLi = createChatLi('On it…', 'incoming');
      chatbox.appendChild(incomingChatLi);
      chatbox.scrollTo(0, chatbox.scrollHeight);
      await generateResponse(incomingChatLi);
    }, 200);
  }

  chatInput.addEventListener('input', () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
    if (!authToken && chatInput.value.trim() && !authPromptShown) {
      document.body.classList.add('show-chatbot');
      promptSignIn();
    }
  });
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 800) {
      e.preventDefault();
      handleChat();
    }
  });
  sendChatBtn.addEventListener('click', handleChat);
  closeBtn.addEventListener('click', () => document.body.classList.remove('show-chatbot'));
  chatbotToggler.addEventListener('click', async () => {
    const willOpen = !document.body.classList.contains('show-chatbot');
    document.body.classList.toggle('show-chatbot');
    if (willOpen) {
      if (!authToken && !authPromptShown) {
        promptSignIn();
      }
      try {
        await ensureChatSession();
      } catch (err) {
        const li = createChatLi(err.message || 'Unable to start chat.', 'incoming');
        chatbox.appendChild(li);
      }
    }
  });

  document.addEventListener('click', e => {
    if (!document.body.classList.contains('show-chatbot')) return;
    const target = e.target;
    if (chatbotPanel?.contains(target)) return;
    if (chatbotToggler?.contains(target)) return;
    if (openChat?.contains(target)) return;
    document.body.classList.remove('show-chatbot');
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('show-chatbot')) {
      document.body.classList.remove('show-chatbot');
      return;
    }
    if (isAuthModalOpen()) {
      closeAuthModal();
    }
  });

  // Home filters
  [filterPlatform, filterYear, filterSearch].forEach(el =>
    el?.addEventListener('input', () => renderHome())
  );
  filterReset?.addEventListener('click', () => {
    if (filterPlatform) filterPlatform.value = '';
    if (filterYear) filterYear.value = '';
    if (filterSearch) filterSearch.value = '';
    renderHome();
  });

  // Close nav on route changes
  window.addEventListener('hashchange', closeNav);

  // Profile filters
  collectionFilter?.addEventListener('change', renderCollectionGrid);

  // --- Auth UI wiring ---
  updateAuthUI();
  authBtn?.addEventListener('click', () => {
    if (authUser) {
      setAuth(null, '');
    } else {
      openAuthModal();
      setTimeout(() => authEmail?.focus(), 50);
    }
  });
  authTabs.forEach(btn => btn.addEventListener('click', () => setAuthTab(btn.dataset.authTab)));
  authModal
    ?.querySelectorAll('[data-auth-close]')
    ?.forEach(el => el.addEventListener('click', closeAuthModal));
  authForms.login?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = (authEmail?.value || '').trim();
    const password = (authPass?.value || '').trim();
    if (!email || !password) return;
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await resp.json();
      if (!resp.ok) {
        throw new Error(payload?.error || 'Login failed');
      }
      setAuth(payload.user, payload.token);
      try {
        await fetchProfileBundle();
      } catch {}
      authPromptShown = false;
      closeAuthModal();
    } catch (err) {
      const message = err?.message ? `Login failed: ${err.message}` : 'Login failed';
      alert(message);
    }
  });
  authForms.register?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = (authNameReg?.value || '').trim();
    const email = (authEmailReg?.value || '').trim();
    const password = (authPassReg?.value || '').trim();
    if (!email || !password) return;
    const username = name || email.split('@')[0] || 'trainer';
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const raw = await resp.text();
      let payload;
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        payload = null;
      }
      if (!resp.ok) {
        const msg = payload?.error || raw || 'Registration failed';
        throw new Error(msg);
      }
      setAuth(payload?.user, payload?.token);
      try {
        await fetchProfileBundle();
      } catch {}
      authPromptShown = false;
      closeAuthModal();
    } catch (err) {
      const message = err?.message ? `Registration failed: ${err.message}` : 'Registration failed';
      alert(message);
    }
  });

  // Settings actions
  document.getElementById('save-preferences')?.addEventListener('click', persistSettings);
  document.getElementById('save-password')?.addEventListener('click', async () => {
    if (!authUser) {
      promptSignInWithOak();
      return;
    }
    const userId = authUser.id || authUser._id;
    const newPassword = (document.getElementById('settings-pass-new')?.value || '').trim();
    if (!newPassword || newPassword.length < 6) {
      alert('Please provide a new password (min 6 characters).');
      return;
    }
    try {
      await apiJson(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      });
      alert('Password updated');
    } catch (err) {
      alert(err?.message || 'Password update failed');
    }
  });
  document.getElementById('save-account')?.addEventListener('click', async () => {
    if (!authUser) {
      promptSignInWithOak();
      return;
    }
    const userId = authUser.id || authUser._id;
    const username = (settingsName?.value || '').trim();
    try {
      const resp = await apiJson(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ username }),
      });
      if (resp?.user) {
        setAuth(resp.user, authToken);
        await fetchProfileBundle();
        renderProfile();
      }
      alert('Account updated');
    } catch (err) {
      alert(err?.message || 'Account update failed');
    }
  });
  document.getElementById('clear-storage')?.addEventListener('click', () => {
    localStorage.clear();
    setAuth(null, '');
    renderPosts();
    renderHome();
    alert('Local data cleared');
  });
  document.getElementById('revoke-sessions')?.addEventListener('click', () => {
    setAuth(null, '');
    alert('All sessions revoked (demo)');
  });

  // Initial render
  onRoute().catch(console.error);
  // Try to hydrate auth chip from server token if present (optional)
  if (authToken && !authUser) {
    api
      .validate()
      .then(data => {
        if (data?.user) {
          setAuth(data.user, authToken);
          fetchProfileBundle().catch(() => {});
        }
      })
      .catch(() => {});
  }
});
