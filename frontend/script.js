document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const $ = sel => document.querySelector(sel);
  const homeView = $('#home-view');
  const gameView = $('#game-view');
  const aboutView = $('#about-view');
  const mainNav = document.querySelector('.main-nav');
  const navBackdrop = document.querySelector('.nav-backdrop');
  const menuToggle = document.querySelector('.menu-toggle');
  const grid = $('#game-grid');
  const backBtn = $('#back-btn');
  const gameTitle = $('#game-title');
  const gameArt = $('#game-art');
  const gamePlatform = $('#game-platform');
  const gameYear = $('#game-year');
  const gameVersion = $('#game-version');
  const gameDescription = $('#game-description');
  const tipsList = $('#tips-list');
  const faqList = $('#faq-list');
  const openChat = $('#open-chat');
  const scrollForum = $('#scroll-forum');
  const forumEl = $('#forum');
  const postsEl = $('#posts');
  const postForm = $('#post-form');
  const postName = $('#post-name');
  const postText = $('#post-text');
  // Tabs
  const tabsHost = document.getElementById('game-tabs');
  const tabButtons = tabsHost ? Array.from(tabsHost.querySelectorAll('[data-tab]')) : [];
  const tabPanels = tabsHost ? Array.from(tabsHost.querySelectorAll('[data-panel]')) : [];
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

  // Gemini API config (nothing yet)
  // Gemini API via local server proxy; no API key in client
  const API_URL = '/api/chat';
  const API_BASE = '/api';
  // Chat avatar asset (Professor Oak)
  const OAK_AVATAR = 'assets/PikPng.com_professor-oak-png_1480585.png';
  // Persona toggle: when true, the bot speaks as Prof. Oak
  const OAK_PERSONA = true;
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
    authBtn.textContent = authUser ? 'Sign out' : 'Sign in';
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

  // App State (fallback seeds, replaced by API if available)
  let games = [
    {
      id: 'fire-red',
      title: 'Pokémon Fire Red',
      platform: 'GBA',
      year: '2004',
      version: 'Kanto',
      art: 'assets/box art/640px-FireRed_EN_boxart.png',
      banner: 'assets/map/red.png',
      description:
        'Return to Kanto in this remake of the original adventure. Catch, train, and battle across iconic towns and routes.',
      tips: [
        'Pick Bulbasaur for an easier early-game vs. Brock and Misty.',
        'Catch a Flying-type early for utility (e.g., Pidgey).',
        'Use the Vs. Seeker to level efficiently on known trainers.',
      ],
      faq: [
        {
          q: 'Where to get the VS Seeker?',
          a: 'Route 24/25 area: Receive it from the aide after leaving the Underground Path house near Vermilion City (after getting the Bike Voucher).',
        },
        {
          q: 'How to get Flash for Rock Tunnel?',
          a: 'Catch at least 10 Pokémon and visit Professor Oak’s aide on Route 2 (south of Pewter via Diglett’s Cave) to receive HM05 Flash.',
        },
      ],
    },
    {
      id: 'emerald',
      title: 'Pokémon Emerald',
      platform: 'GBA',
      year: '2005',
      version: 'Hoenn',
      art: 'assets/box art/emerald.jpg',
      banner: 'assets/map/emerald.png',
      description: 'The definitive Hoenn experience with Battle Frontier and more double battles.',
      tips: [
        'Mudkip eases early gyms; Treecko is fast but fragile.',
        'Prepare for lots of double battles—balance your team roles.',
        'Try the Battle Frontier post-game for advanced challenges.',
      ],
    },
  ];
  let gamesLoadedFromApi = false;
  const gamesById = new Map();
  const tipsCache = new Map();
  const faqCache = new Map();
  const postsCache = new Map();
  let currentGameId = null;

  function syncGameIndex() {
    gamesById.clear();
    games.forEach(g => gamesById.set(g.id, g));
  }
  syncGameIndex();

  // Profile mock data (local only)
  const profileData = {
    name: 'Trainer Oak Jr.',
    tagline: 'Retro collector and walkthrough writer.',
    avatar: 'assets/pixel/6Vww.gif',
    tags: ['Collector', 'Guide writer', 'Kanto native'],
    stats: [
      { label: 'Games cleared', value: 42 },
      { label: 'Badges earned', value: 48 },
      { label: 'Tips shared', value: 128 },
    ],
    achievements: [
      { title: 'Kanto Veteran', desc: 'Completed all Gym Leader rematches', tier: 'gold' },
      { title: 'Frontier Brain', desc: 'Won 50 Battle Frontier streak', tier: 'platinum' },
      { title: 'Dex Scholar', desc: 'Filled regional dex without trades', tier: 'silver' },
      { title: 'Speedrunner', desc: 'Beat Elite Four in under 3 hours', tier: 'bronze' },
    ],
  };

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  }

  function mapApiGame(g) {
    if (!g) return null;
    return {
      id: g.slug || g.id || g._id,
      slug: g.slug || g.id || g._id,
      title: g.title,
      platform: g.platform,
      year: g.releaseYear || g.year,
      version: g.versionLabel || g.region || 'Retro',
      art: g.coverImageUrl,
      banner: g.heroImageUrl || g.coverImageUrl,
      hover: g.hoverImageUrl || g.coverImageUrl,
      description: g.description,
      screenshots: Array.isArray(g.screenshots) ? g.screenshots : [],
      theme: g.theme,
    };
  }

  async function loadGamesFromApi() {
    try {
      const data = await fetchJson(`${API_BASE}/games`);
      const mapped = (data?.games || []).map(mapApiGame).filter(Boolean);
      if (mapped.length) {
        games = mapped;
        syncGameIndex();
      }
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
        if (tips.length) tipsCache.set(g.id, tips);
        if (faqs.length) faqCache.set(g.id, faqs);
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

  async function loadTips(gameId) {
    if (tipsCache.has(gameId)) return tipsCache.get(gameId);
    const { tips = [] } = await api.getTips(gameId);
    tipsCache.set(gameId, tips);
    return tips;
  }

  async function loadFaqs(gameId) {
    if (faqCache.has(gameId)) return faqCache.get(gameId);
    const { faqs = [] } = await api.getFaqs(gameId);
    faqCache.set(gameId, faqs);
    return faqs;
  }

  async function loadPosts(gameId) {
    if (postsCache.has(gameId)) return postsCache.get(gameId);
    const { posts = [] } = await api.getPosts(gameId);
    postsCache.set(gameId, posts);
    return posts;
  }

  // Per-game randomized welcome messages
  const welcomePool = {
    generic: [
      'Hi there! Select a game to get tailored help.',
      'Welcome! Pick a game and ask for tips or a walkthrough.',
      'Need guidance? Choose a game and start asking questions!',
    ],
    'fire-red': [
      'Welcome to Kanto! Ask about gyms, routes, or items like the VS Seeker.',
      'Fire Red tips ready—starters, Brock & Misty strats, or where to find Flash.',
      'Got questions for Kanto? Teams, badges, or leveling—ask away!',
    ],
    emerald: [
      'Hoenn time! Ask about gyms, Team Aqua/Magma, or the Battle Frontier.',
      'Emerald tips: double battles, good early team picks, or EXP spots.',
      'Want Battle Frontier pointers or story progression help?',
    ],
    'heart-gold': [
      'Johto awaits! Ask about Whitney’s Miltank or where to get Exp. Share.',
      'Need help with Johto gyms or Kanto post-game?',
      'Heart Gold tips—routes, items, and gym strategies.',
    ],
    platinum: [
      'Sinnoh tips here! Distortion World, team ideas, or leveling routes.',
      'Platinum help: gym counters, Giratina path, or dex variety.',
      'Ask about Sinnoh travel, items, or story beats.',
    ],
    'black-2': [
      'Unova guidance: Join Avenue, EXP farming, or story routes.',
      'Black 2 tips—Habitat List, Lucky Egg, or team balance.',
      'Need help with challenge modes or gym plans?',
    ],
    y: [
      'Kalos help ready! Mega Ring, team comps, or gym counters.',
      'Pokémon Y tips—Exp. Share pacing, Megas, or early-game teams.',
      'Ask about routes, items, or where to go next in Kalos.',
    ],
  };

  function randomWelcome(id) {
    const arr = welcomePool[id] || welcomePool.generic;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function resetChatWithWelcome(gameId) {
    chatbox.innerHTML = '';
    const greeting = randomWelcome(gameId);
    const li = document.createElement('li');
    li.className = 'chat incoming';
    const opening = 'Hello there! Welcome to the world of Pokémon!\n\n';
    li.innerHTML = `<img src="${OAK_AVATAR}" alt="Professor Oak" class="chat-avatar" /><p>${opening}${greeting}</p>`;
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
    'fire-red': 'assets/game/fire-red.gif',
    emerald: 'assets/game/pokemon-emerald.gif',
    'heart-gold': 'assets/game/heart-gold.gif',
    platinum: 'assets/game/platinum.gif',
    'black-2': 'assets/game/black2.gif',
    y: 'assets/game/y.gif',
  };

  function activateTab(id) {
    tabButtons.forEach(btn => {
      const active = btn.dataset.tab === id;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });
    tabPanels.forEach(panel => {
      const active = panel.dataset.panel === id;
      panel.classList.toggle('active', active);
      panel.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  }

  // New: gameplay GIFs for the hero area (inside pages)
  const gameplayGifMap = {
    'fire-red': 'assets/gameplay/pokemon-fire-red.gif',
    emerald: 'assets/gameplay/emerald.gif',
    'heart-gold': 'assets/gameplay/heartgold.gif',
    platinum: 'assets/gameplay/platinum.gif',
    'black-2': 'assets/gameplay/black2.gif',
    y: 'assets/gameplay/y.gif',
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
  };
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
    resetChatWithWelcome(null);
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
      const openDetail = () => navigateTo(`#/${g.id}`);
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
    currentGameId = game.id;
    // Apply per-game theme (fallback to platform-based coloring)
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

    gameTitle.textContent = game.title;
    // Prefer gameplay GIF if available, then banner, then art
    const heroUrl = gameplayGifMap[game.id] || game.banner || game.art || game.coverImageUrl || '';
    if (heroUrl) {
      gameArt.classList.remove('no-image');
      gameArt.style.backgroundImage = `url('${heroUrl}')`;
    } else {
      gameArt.style.backgroundImage = '';
      gameArt.classList.add('no-image');
    }
    gamePlatform.textContent = textOrFallback(game.platform, 'Platform TBA');
    gameYear.textContent = textOrFallback(game.year, 'Year TBA');
    gameVersion.textContent = textOrFallback(game.version || game.region, 'Version TBA');
    gameDescription.textContent = textOrFallback(game.description);
    chatSubtitle.textContent = `Chatting about: ${game.title}`;
    // Reset chatbot with a per-game randomized welcome
    resetChatWithWelcome(game.id);

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
    activateTab('tips');

    // Forum posts
    await renderPosts();
  }

  async function renderPosts() {
    postsEl.innerHTML = '';
    const loading = document.createElement('li');
    loading.className = 'post';
    loading.innerHTML = '<div class="bubble"><div class="text">Loading posts…</div></div>';
    postsEl.appendChild(loading);
    if (!currentGameId) return;
    try {
      const posts = await loadPosts(currentGameId);
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
    const list = buildCollection().filter(item =>
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
    profileData.achievements.forEach(a => {
      const card = document.createElement('div');
      card.className = `achievement tier-${a.tier}`;
      card.innerHTML = `<h4>${a.title}</h4><p>${a.desc}</p>`;
      achievementsGrid.appendChild(card);
    });
  }

  function renderProfile() {
    if (!profileView) return;
    profileAvatar.src = profileData.avatar;
    profileTagline.textContent = profileData.tagline;
    profileTags.innerHTML = '';
    profileData.tags.forEach(t => {
      const c = document.createElement('span');
      c.className = 'chip';
      c.textContent = t;
      profileTags.appendChild(c);
    });
    profileStats.innerHTML = '';
    profileData.stats.forEach(stat => {
      const s = document.createElement('div');
      s.className = 'stat';
      s.innerHTML = `<div class="label">${stat.label}</div><div class="value">${stat.value}</div>`;
      profileStats.appendChild(s);
    });
    renderCollectionGrid();
    renderAchievements();
  }

  const SETTINGS_KEY = 'retrohub-settings';
  function hydrateSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (settingsName) settingsName.value = stored.name || authUser?.name || 'Trainer';
      if (settingsEmail)
        settingsEmail.value = stored.email || authUser?.email || 'trainer@example.com';
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
      email: settingsEmail?.value || 'trainer@example.com',
      prefChat: !!prefChat?.checked,
      prefBadge: !!prefBadge?.checked,
      prefAnalytics: !!prefAnalytics?.checked,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    alert('Your settings have been saved successfully');
  }

  // Forum submit
  postForm.addEventListener('submit', async e => {
    e.preventDefault();
    const text = postText.value.trim();
    if (!text || !currentGameId) return;
    if (!authToken) {
      promptSignInWithRetroBot();
      return;
    }
    try {
      await api.createPost(currentGameId, text);
      postText.value = '';
      postsCache.delete(currentGameId);
      await renderPosts();
    } catch (err) {
      if (err.status === 401) {
        promptSignInWithRetroBot();
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
      const id = parts[0];
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
      const proceed = async () => {
        let game = games.find(g => g.id === id || g.slug === id);
        if (!game) {
          await loadGamesFromApi();
          game = games.find(g => g.id === id || g.slug === id);
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
          fetchGameFull(game.id).then(full => {
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
  openChat.addEventListener('click', () => {
    document.body.classList.add('show-chatbot');
    if (!authToken && !authPromptShown) {
      promptSignInWithOak();
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
  scrollForum.addEventListener('click', () => {
    activateTab('community');
    forumEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    postText?.focus({ preventScroll: true });
  });
  tabButtons.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));

  // Chatbot logic (Google Gemini API)
  const inputInitHeight = chatInput.scrollHeight;
  let userMessage = '';
  let authPromptShown = false;

  const createChatLi = (message, className) => {
    const chatLi = document.createElement('li');
    chatLi.classList.add('chat', className);
    chatLi.innerHTML =
      className === 'outgoing'
        ? `<p>${message}</p>`
        : `<img src="${OAK_AVATAR}" alt="Professor Oak" class="chat-avatar" /><p>${message}</p>`;
    return chatLi;
  };

  // Randomized Oak persona messages to prompt sign-in
  function getOakSignInMessage() {
    const options = [
      "Ah! You'll need to sign in at my lab before we can chat.",
      'Hold on, Trainer! Please sign in so I can assist you properly.',
      "Hm! Access denied—sign in first, then I'll help you out.",
      "Aha! I recognize keen curiosity—sign in, and let's begin.",
      'Patience! Sign in to sync your Trainer Card, then ask away.',
      'Safety first! Please sign in so I can share proper guidance.',
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Show an Oak-styled sign-in prompt and open the login modal
  function promptSignInWithOak(replaceEl) {
    const msg = getOakSignInMessage();
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

  // Build a strong domain-constrained prompt with per-game context
  function buildPrompt(userText) {
    const game = gamesById.get(currentGameId) || games.find(g => g.id === currentGameId);
    const title = game?.title || 'Pokémon (series)';
    const platform = game?.platform || 'Various';
    const year = game?.year || '';
    const version = game?.version || '';
    const description = game?.description || '';
    const tipsArr = tipsCache.get(currentGameId) || [];
    const faqsArr = faqCache.get(currentGameId) || [];
    const tips = tipsArr.map(t => `- ${t.content || t}`).join('\n');
    const faqs = faqsArr.map(f => `- Q: ${f.question || f.q}\n  A: ${f.answer || f.a}`).join('\n');

    const persona = OAK_PERSONA
      ? 'You are Professor Oak speaking to the player. Keep a warm, mentor-like tone. Use first-person briefly when helpful ("I"/"my lab"), but stay concise and practical. Do not roleplay long monologues.'
      : 'You are Pokémon Helper Bot.';
    return `
${persona} Your purpose is to answer ONLY Pokémon game questions. If the user asks about anything non-Pokémon (news, politics, code, math, etc.), refuse briefly and steer them back to Pokémon gameplay, tips, items, routes, gyms, or strategies.

When the user opens a specific game, you MUST tailor your answers strictly to that title. Keep responses concise and actionable. Prefer steps or bullet points. Include route/town names, items, or NPCs when useful. If you don't know, say so briefly and suggest an in-game direction.

Game context:
- Title: ${title}
- Platform: ${platform}
- Year: ${year}
- Version/Region: ${version}
- Description: ${description}
- Quick Tips:\n${tips || '- (none)'}
- Popular Q&A:\n${faqs || '- (none)'}

User question:
${userText}

Constraints:
- Stay Pokémon-only. Politely refuse unrelated topics.
- Be specific to ${title}. If the question is about another game, ask the user to open that game from Home.
- Be brief; use bullets or short steps when appropriate.
`.trim();
  }

  const generateResponse = async chatElement => {
    const messageElement = chatElement.querySelector('p');
    const requestOptions = {
      method: 'POST',
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        authToken ? { Authorization: `Bearer ${authToken}` } : {}
      ),
      body: JSON.stringify({ prompt: buildPrompt(userMessage) }),
    };
    try {
      const response = await fetch(API_URL, requestOptions);
      if (response.status === 401) {
        promptSignInWithOak(chatElement);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        const msg = data?.error?.message || response.statusText || 'Request failed';
        throw new Error(msg);
      }
      const text = (data?.text || '').replace(/\*\*(.*?)\*\*/g, '$1');
      messageElement.textContent = text || 'No response received. Try again.';
      // After rendering the answer, go to the TOP of this message (not the bottom)
      try {
        chatElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        chatbox.scrollTop = Math.max(0, chatElement.offsetTop - 8);
      }
    } catch (error) {
      messageElement.classList.add('error');
      const hint =
        'If you are running locally, ensure the server is started and GEMINI_API_KEY is set in .env';
      messageElement.textContent = (error.message || 'Error contacting Gemini API') + '\n' + hint;
      // Ensure the user sees the start of the error message
      try {
        chatElement.scrollIntoView({ behavior: 'auto', block: 'start' });
      } catch {
        chatbox.scrollTop = Math.max(0, chatElement.offsetTop - 8);
      }
    }
  };

  function handleChat() {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;
    if (!authToken) {
      // Append the user's message, then have Oak respond with a sign-in prompt
      chatInput.value = '';
      chatInput.style.height = `${inputInitHeight}px`;
      chatbox.appendChild(createChatLi(userMessage, 'outgoing'));
      chatbox.scrollTo(0, chatbox.scrollHeight);
      const incoming = createChatLi(getOakSignInMessage(), 'incoming');
      chatbox.appendChild(incoming);
      chatbox.scrollTo(0, chatbox.scrollHeight);
      openAuthModal();
      setTimeout(() => authEmail?.focus(), 50);
      return;
    }
    chatInput.value = '';
    chatInput.style.height = `${inputInitHeight}px`;
    chatbox.appendChild(createChatLi(userMessage, 'outgoing'));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
      const incomingChatLi = createChatLi('Thinking…', 'incoming');
      chatbox.appendChild(incomingChatLi);
      chatbox.scrollTo(0, chatbox.scrollHeight);
      generateResponse(incomingChatLi);
    }, 300);
  }

  chatInput.addEventListener('input', () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
    if (!authToken && chatInput.value.trim() && !authPromptShown) {
      document.body.classList.add('show-chatbot');
      promptSignInWithOak();
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
  chatbotToggler.addEventListener('click', () => {
    document.body.classList.toggle('show-chatbot');
    if (document.body.classList.contains('show-chatbot') && !authToken && !authPromptShown) {
      promptSignInWithOak();
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
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload?.error || 'Registration failed');
      setAuth(payload.user, payload.token);
      authPromptShown = false;
      closeAuthModal();
    } catch (err) {
      const message = err?.message ? `Registration failed: ${err.message}` : 'Registration failed';
      alert(message);
    }
  });

  // Settings actions
  document.getElementById('save-account')?.addEventListener('click', persistSettings);
  document.getElementById('save-preferences')?.addEventListener('click', persistSettings);
  document
    .getElementById('save-password')
    ?.addEventListener('click', () => alert('Password update requested (demo only)'));
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
        }
      })
      .catch(() => {});
  }
});
