document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const $ = sel => document.querySelector(sel);
  const app = $('#app');
  const homeView = $('#home-view');
  const gameView = $('#game-view');
  const aboutView = $('#about-view');
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

  // Chatbot elements
  const chatbotToggler = document.querySelector('.chatbot-toggler');
  const closeBtn = document.querySelector('.close-btn');
  const chatbox = document.querySelector('.chatbox');
  const chatInput = document.querySelector('.chat-input textarea');
  const sendChatBtn = document.querySelector('#send-btn');
  const chatSubtitle = document.querySelector('#chat-subtitle');
  // Auth elements
  const authBtn = document.getElementById('auth-btn');
  const authChip = document.getElementById('auth-chip');
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');
  const authEmail = document.getElementById('auth-email');
  const authPass = document.getElementById('auth-pass');
  // Header GIF slot configuration (random pixel GIF on the right side)
  const headerEl = document.querySelector('.app-header');
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

  function ensureHeaderGifHost() {
    if (!headerEl) return null;
    if (!headerGifHost) {
      headerGifHost = document.createElement('div');
      headerGifHost.id = 'header-gif';
      headerGifHost.setAttribute('aria-hidden', 'true');
      headerGifImg = document.createElement('img');
      headerGifImg.alt = '';
      headerGifImg.loading = 'lazy';
      headerGifImg.decoding = 'async';
      headerGifHost.appendChild(headerGifImg);
      headerEl.appendChild(headerGifHost);
    }
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
      host.style.display = 'none';
      return;
    }
    host.style.display = '';
    const idx = pickNewGifIndex();
    if (idx >= 0) {
      headerGifImg.src = pixelGifs[idx];
    }
  }

  // Gemini API config (nothing yet)
  // Gemini API via local server proxy; no API key in client
  const API_URL = '/api/chat';
  // Chat avatar asset (RetroBot)
  const RETROBOT_AVATAR = 'assets/pixel/6Vww.gif';
  // Persona toggle: when true, the bot speaks in a retro helper voice
  const RETROBOT_PERSONA = false;
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

  function openAuthModal() {
    if (authModal) authModal.setAttribute('aria-hidden', 'false');
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

  async function loadGames() {
    const { games: list = [] } = await api.getGames();
    games = list.map(g => ({ ...g, id: g._id }));
    gamesById.clear();
    games.forEach(g => gamesById.set(g.id, g));
    return games;
  }

  let gamesLoadPromise = null;
  async function ensureGamesLoaded() {
    if (games && games.length) return games;
    if (!gamesLoadPromise) {
      gamesLoadPromise = loadGames().catch(err => {
        gamesLoadPromise = null;
        throw err;
      });
    }
    return gamesLoadPromise;
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

  // App State (API-driven)
  let games = [];
  const gamesById = new Map();
  const tipsCache = new Map();
  const faqCache = new Map();
  const postsCache = new Map();
  let currentGameId = null;

  // Per-game randomized welcome messages
  const welcomePool = {
    generic: [
      'Hi there! Select a game to get tailored help.',
      'Welcome to RetroHub! Pick a game and ask for tips or a walkthrough.',
      'Need guidance? Choose a title and start asking questions!',
    ],
    'chrono-trigger': [
      'Crono and friends are ready—ask about techs, endings, or era routes.',
      'Want guidance on Magus, Black Omen, or side quests?',
      'Need a route for multiple endings or fast TP?',
    ],
    'super-metroid': [
      'Zebes awaits—ask about suits, bosses, or sequence breaks.',
      'Need help with wall jumps, mockball, or item routes?',
      'Stuck in Wrecked Ship or Maridia? I can guide you.',
    ],
    'link-to-the-past': [
      'Hyrule help—dungeon order, key items, or Dark World routes.',
      'Need Flute, medallions, or heart piece tips?',
      'Ask about bosses, fast travel, or secret caves.',
    ],
    'sonic-2': [
      'Speedrun or casual? Ask about Chaos Emeralds or ring routes.',
      'Need Special Stage help or boss tips?',
      'Looking to unlock Super Sonic efficiently?',
    ],
    'mega-man-x': [
      'Maverick order, Heart Tanks, or armor pieces—ask away.',
      'Need weaknesses or Hadouken capsule steps?',
      'Want a fast route to dash boots and upgrades?',
    ],
    sotn: [
      'Castle tips—relics, rings, and inverted path questions welcome.',
      'Need a good farm spot or weapon suggestion?',
      'Ask about Richter, Holy Glasses, or map completion.',
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
    const opening = 'Welcome to RetroHub! Ask anything about your chosen game.\n\n';
    li.innerHTML = `<img src="${RETROBOT_AVATAR}" alt="RetroBot" class="chat-avatar" /><p>${opening}${greeting}</p>`;
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
    'chrono-trigger': '',
    'super-metroid': '',
    'link-to-the-past': '',
    'sonic-2': '',
    'mega-man-x': '',
    sotn: '',
  };

  // New: gameplay GIFs for the hero area (inside pages)
  const gameplayGifMap = {
    'chrono-trigger': '',
    'super-metroid': '',
    'link-to-the-past': '',
    'sonic-2': '',
    'mega-man-x': '',
    sotn: '',
  };

  // Render Home Grid
  function renderHome() {
    grid.innerHTML = '';
    // Theme: Home (light red/white)
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    document.body.classList.add('theme-home');
    // Reset chatbot with generic welcome on Home
    resetChatWithWelcome(null);
    if (!games.length) {
      grid.innerHTML =
        '<div class="map-hint" role="alert">No games found. Check if the game service is running.</div>';
      return;
    }
    games.forEach(g => {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('role', 'listitem');
      const thumbStyle = g.coverImageUrl
        ? `style="background-image:url('${g.coverImageUrl}')"`
        : '';
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
            <span class="chip">${g.releaseYear || ''}</span>
          </div>
          <button class="cta" data-open="${g.id}">Open</button>
        </div>
      `;
      // Hover GIF preview per game (Home only)
      const thumb = card.querySelector('.thumb');
      const originalUrl = g.coverImageUrl || '';
      const gifUrl = gameGifMap[g.id] || '';
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
      card.querySelector('[data-open]')?.addEventListener('click', () => navigateTo(`#/${g.id}`));
      grid.appendChild(card);
    });
  }

  // Render Game Detail
  async function renderGame(game) {
    currentGameId = game.id;
    // Apply per-game theme (fallback to platform-based coloring)
    const themeMap = {
      gba: 'theme-fire-red',
      ds: 'theme-platinum',
      '3ds': 'theme-y',
      snes: 'theme-emerald',
      playstation: 'theme-heart-gold',
    };
    const themeKey = (game.platform || '').toLowerCase();
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    document.body.classList.add(themeMap[themeKey] || 'theme-home');

    gameTitle.textContent = game.title;
    const heroUrl = gameplayGifMap[game.id] || game.coverImageUrl || '';
    if (heroUrl) {
      gameArt.classList.remove('no-image');
      gameArt.style.backgroundImage = `url('${heroUrl}')`;
    } else {
      gameArt.style.backgroundImage = '';
      gameArt.classList.add('no-image');
    }
    gamePlatform.textContent = game.platform;
    gameYear.textContent = game.releaseYear || '';
    gameVersion.textContent = game.region || 'Global';
    gameDescription.textContent = game.description;
    chatSubtitle.textContent = `Chatting about: ${game.title}`;
    // Reset chatbot with a per-game randomized welcome
    resetChatWithWelcome(game.id);

    // Region Map panel (uses banner/cover when available)
    const mapPanel = document.getElementById('map-panel');
    const mapImg = document.getElementById('map-image');
    const mapLink = document.getElementById('map-link');
    const mapUrl = game.banner || game.coverImageUrl || '';
    if (mapUrl) {
      mapPanel.style.display = '';
      mapImg.src = mapUrl;
      mapImg.alt = `${game.title} — Region map`;
      mapLink.href = mapUrl;
      // Map modal: open on click instead of navigating away
      const modal = document.getElementById('map-modal');
      const modalImg = document.getElementById('map-modal-image');
      const modalDownload = document.getElementById('map-download');
      const setHidden = hidden => modal.setAttribute('aria-hidden', hidden ? 'true' : 'false');
      const openMap = e => {
        e.preventDefault();
        modalImg.src = mapUrl;
        modalDownload.href = mapUrl;
        setHidden(false);
      };
      const closeMap = () => setHidden(true);
      mapLink.onclick = openMap;
      modal.querySelectorAll('[data-close-map]').forEach(el => (el.onclick = closeMap));
      window.addEventListener(
        'keydown',
        ev => {
          if (ev.key === 'Escape') closeMap();
        },
        { once: true }
      );
    } else {
      mapPanel.style.display = 'none';
      mapImg.removeAttribute('src');
      mapLink.removeAttribute('href');
    }

    // Tips
    tipsList.innerHTML = '';
    try {
      const tips = await loadTips(game.id);
      if (!tips.length) {
        const li = document.createElement('li');
        li.textContent = 'No tips yet.';
        tipsList.appendChild(li);
      } else {
        tips.forEach(t => {
          const li = document.createElement('li');
          li.textContent = t.content || t;
          tipsList.appendChild(li);
        });
      }
    } catch (err) {
      const li = document.createElement('li');
      li.textContent = 'Unable to load tips right now.';
      tipsList.appendChild(li);
      console.error(err);
    }

    // FAQ
    faqList.innerHTML = '';
    try {
      const faqs = await loadFaqs(game.id);
      if (!faqs.length) {
        const d = document.createElement('div');
        d.className = 'map-hint';
        d.textContent = 'No FAQs yet.';
        faqList.appendChild(d);
      } else {
        faqs.forEach(({ question, answer }) => {
          const d = document.createElement('details');
          const s = document.createElement('summary');
          s.textContent = question;
          d.appendChild(s);
          const p = document.createElement('p');
          p.textContent = answer;
          d.appendChild(p);
          faqList.appendChild(d);
        });
      }
    } catch (err) {
      const d = document.createElement('div');
      d.className = 'map-hint';
      d.textContent = 'Unable to load FAQs right now.';
      faqList.appendChild(d);
      console.error(err);
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
  async function onRoute() {
    const hash = window.location.hash || '#/';
    const parts = hash.slice(2).split('/').filter(Boolean);
    // Update active nav link state
    const markActive = route => {
      document.querySelectorAll('.nav-link').forEach(a => {
        const href = a.getAttribute('href');
        if ((route === 'home' && href === '#/') || (route === 'about' && href === '#/about')) {
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
      renderHome();
      markActive('home');
      // Show a random header gif on Home
      setHeaderGifVisible(true);
      resetScrollTop();
    } else {
      const id = parts[0];
      // About route: dedicated minimal page showing only the Meowth City GIF
      if (id === 'about') {
        homeView.classList.remove('active');
        gameView.classList.remove('active');
        aboutView.classList.add('active');
        // Apply About theme tokens and ensure chatbot is closed
        document.body.className = document.body.className
          .split(' ')
          .filter(c => !c.startsWith('theme-'))
          .join(' ');
        document.body.classList.add('theme-about');
        document.body.classList.remove('show-chatbot');
        // Hide header gif on About
        setHeaderGifVisible(false);
        markActive('about');
        resetScrollTop();
        return;
      }
      let game = gamesById.get(id);
      if (!game) {
        try {
          const { game: fetched } = await api.getGame(id);
          if (fetched) {
            game = { ...fetched, id: fetched._id };
            gamesById.set(game.id, game);
            if (!games.find(g => g.id === game.id)) {
              games.push(game);
            }
          }
        } catch (err) {
          console.error('Game not found', err);
        }
      }
      if (game) {
        aboutView.classList.remove('active');
        homeView.classList.remove('active');
        gameView.classList.add('active');
        await renderGame(game);
        markActive('');
        // Show a random header gif on Game pages
        setHeaderGifVisible(true);
        resetScrollTop();
      } else {
        // fallback to home
        navigateTo('#/');
      }
    }
  }
  window.addEventListener('hashchange', () => onRoute().catch(console.error));

  // Back and Jump actions
  backBtn.addEventListener('click', () => navigateTo('#/'));
  openChat.addEventListener('click', () => {
    document.body.classList.add('show-chatbot');
    if (!authToken && !authPromptShown) {
      promptSignInWithRetroBot();
    }
    chatInput.focus();
  });
  scrollForum.addEventListener('click', () => {
    forumEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

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
        : `<img src="${RETROBOT_AVATAR}" alt="RetroBot" class="chat-avatar" /><p>${message}</p>`;
    return chatLi;
  };

  // Randomized RetroBot persona messages to prompt sign-in
  function getRetroBotSignInMessage() {
    const options = [
      'Sign in to save your posts and sync across devices.',
      'Sign in to keep your chat context and forum posts.',
      'Create an account to sync tips and bookmarks.',
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Show a RetroBot-styled sign-in prompt and open the login modal
  function promptSignInWithRetroBot(replaceEl) {
    const msg = getRetroBotSignInMessage();
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
    const game = gamesById.get(currentGameId);
    const title = game?.title || 'Retro game';
    const platform = game?.platform || 'Various';
    const year = game?.releaseYear || '';
    const version = game?.region || '';
    const description = game?.description || '';
    const tipsArr = tipsCache.get(currentGameId) || [];
    const faqsArr = faqCache.get(currentGameId) || [];
    const tips = tipsArr.map(t => `- ${t.content || t}`).join('\n');
    const faqs = faqsArr.map(f => `- Q: ${f.question || f.q}\n  A: ${f.answer || f.a}`).join('\n');

    const persona = RETROBOT_PERSONA
      ? 'You are RetroBot, a concise retro gaming assistant. Keep tone friendly, skip roleplay, focus on clear, actionable answers.'
      : 'You are a concise retro gaming helper.';

    return `
${persona} Answer only with gameplay help for the selected classic title. If the user asks about unrelated topics, politely steer back to the game. Prefer short steps or bullets. If unsure, say so briefly and suggest a likely direction in-game.

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
- Stay on retro gaming help for the listed title.
- Be brief; use bullets or short steps when appropriate.
`.trim();
  }

  const generateResponse = async chatElement => {
    const messageElement = chatElement.querySelector('p');
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ message: userMessage, prompt: buildPrompt(userMessage) }),
    };

    try {
      const response = await fetch(API_URL, requestOptions);
      if (response.status === 401) {
        promptSignInWithRetroBot(chatElement);
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
      // Append the user's message, then have RetroBot respond with a sign-in prompt
      chatInput.value = '';
      chatInput.style.height = `${inputInitHeight}px`;
      chatbox.appendChild(createChatLi(userMessage, 'outgoing'));
      chatbox.scrollTo(0, chatbox.scrollHeight);
      const incoming = createChatLi(getRetroBotSignInMessage(), 'incoming');
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
      promptSignInWithRetroBot();
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
      promptSignInWithRetroBot();
    }
  });

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
  authModal
    ?.querySelectorAll('[data-auth-close]')
    ?.forEach(el => el.addEventListener('click', closeAuthModal));
  authForm?.addEventListener('submit', async e => {
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
      alert((err && err.message) || 'Login failed');
    }
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
