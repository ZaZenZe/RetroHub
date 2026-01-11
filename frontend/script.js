document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const $ = (sel) => document.querySelector(sel);
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

  function ensureHeaderGifHost(){
    if(!headerEl) return null;
    if(!headerGifHost){
      headerGifHost = document.createElement('div');
      headerGifHost.id = 'header-gif';
      headerGifHost.setAttribute('aria-hidden','true');
      headerGifImg = document.createElement('img');
      headerGifImg.alt = '';
      headerGifImg.loading = 'lazy';
      headerGifImg.decoding = 'async';
      headerGifHost.appendChild(headerGifImg);
      headerEl.appendChild(headerGifHost);
    }
    return headerGifHost;
  }
  function pickNewGifIndex(){
    if(pixelGifs.length === 0) return -1;
    let idx = Math.floor(Math.random() * pixelGifs.length);
    if(pixelGifs.length > 1 && idx === lastGifIndex){
      idx = (idx + 1) % pixelGifs.length;
    }
    lastGifIndex = idx;
    return idx;
  }
  function setHeaderGifVisible(visible){
    const host = ensureHeaderGifHost();
    if(!host) return;
    if(!visible){ host.style.display = 'none'; return; }
    host.style.display = '';
    const idx = pickNewGifIndex();
    if(idx >= 0){ headerGifImg.src = pixelGifs[idx]; }
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
  try { authUser = JSON.parse(localStorage.getItem('authUser') || 'null'); } catch { authUser = null; }

  function setAuth(user, token){
    authUser = user || null;
    authToken = token || '';
    if(authUser && authToken){
      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('authToken', authToken);
    } else {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    }
    updateAuthUI();
  }

  function updateAuthUI(){
    if(!authBtn) return;
    authBtn.textContent = authUser ? 'Sign out' : 'Sign in';
    if(authChip){
      if(authUser){ authChip.textContent = `Hey, ${authUser.name || authUser.email}`; authChip.style.display = ''; }
      else { authChip.style.display = 'none'; }
    }
  }

  function openAuthModal(){ if(authModal) authModal.setAttribute('aria-hidden','false'); }
  function closeAuthModal(){ if(authModal) authModal.setAttribute('aria-hidden','true'); }

  // App State
  const games = [
    {
      id: 'chrono-trigger',
      title: 'Chrono Trigger',
      platform: 'SNES',
      year: '1995',
      version: 'Time-Travel Saga',
      art: '',
      banner: '',
      description: 'Time-hopping RPG with multiple endings, dual techs, and side quests that reshape the finale.',
      tips: [
        'Use dual/triple techs for efficient boss damage.',
        'Stock Shelters for quick heals at save points.',
        'Do optional era quests before the final fight to unlock better endings.',
      ],
      faq: [
        { q: 'How to recruit Magus?', a: 'During the North Cape confrontation, spare him and he will later join your party.' },
        { q: 'Best place to grind mid-game?', a: 'Use the Hunting Range (Prehistory) for Tech Points and the Black Omen for late-game EXP.' },
      ],
      kb: [
        ['magus|recruit', 'Spare Magus at North Cape; he joins later with strong shadow techs.'],
        ['black omen|exp|tp', 'Run the Black Omen for high EXP/TP and rare drops before Lavos.'],
      ],
    },
    {
      id: 'super-metroid',
      title: 'Super Metroid',
      platform: 'SNES',
      year: '1994',
      version: 'Zebes',
      art: '',
      banner: '',
      description: 'Classic exploratory platformer with sequence breaks, upgrades, and atmospheric boss fights.',
      tips: [
        'Grab the early Charge Beam to conserve ammo.',
        'Use wall jumps and mockball to access items early.',
        'Save before major bosses like Phantoon and Ridley.',
      ],
      faq: [
        { q: 'Where is the Gravity Suit?', a: 'Clear the Wrecked Ship (Phantoon), then reach the suit in the flooded shaft of the ship.' },
        { q: 'How to break glass tube in Maridia?', a: 'Use a Power Bomb inside the tube to shatter it and open the route.' },
      ],
      kb: [
        ['gravity suit|wrecked ship', 'Defeat Phantoon, power the ship, then drop to the flooded shaft for the Gravity Suit.'],
        ['glass tube|maridia|power bomb', 'Detonate a Power Bomb inside the glass tube to enter Maridia.'],
      ],
    },
    {
      id: 'link-to-the-past',
      title: 'The Legend of Zelda: A Link to the Past',
      platform: 'SNES',
      year: '1991',
      version: 'Hyrule',
      art: '',
      banner: '',
      description: 'Top-down adventure with parallel Light/Dark Worlds, dungeons, and key item-driven progression.',
      tips: [
        'Grab the Bottle and Bug Net early for fairies.',
        'Use the Pegasus Boots to break weak walls and reach chests.',
        'Clear Dark World dungeons in flexible order once you have key items.',
      ],
      faq: [
        { q: 'Where to get the Flute?', a: 'In the Light World Haunted Grove; play it to free the bird for fast travel.' },
        { q: 'How to enter Misery Mire?', a: 'Equip the Ether Medallion and use it on the Misery Mire tablet to unlock the dungeon.' },
      ],
      kb: [
        ['flute|fast travel|bird', 'Find the Flute in the Haunted Grove; the bird enables map travel once freed.'],
        ['ether medallion|misery mire', 'Use Ether at the Misery Mire entrance to reveal the dungeon doorway.'],
      ],
    },
    {
      id: 'sonic-2',
      title: 'Sonic the Hedgehog 2',
      platform: 'Sega Genesis',
      year: '1992',
      version: 'Emerald Hill',
      art: '',
      banner: '',
      description: 'High-speed platformer with split-screen races, Super Sonic, and iconic zones.',
      tips: [
        'Use spin dash starts to keep momentum through loops.',
        'Collect 50 rings before checkpoints to enter Special Stages.',
        'Super Sonic drains rings—activate when you can keep pace.',
      ],
      faq: [
        { q: 'How to get all Chaos Emeralds?', a: 'Enter Special Stages via checkpoints with 50 rings; memorize layouts and prioritize ring paths.' },
        { q: 'Best place to farm lives?', a: 'Casino Night Zone has plentiful rings and slot machines—play safely to stock up.' },
      ],
      kb: [
        ['chaos emeralds|special stage', 'Hit checkpoints with 50 rings to access half-pipe Special Stages; learn ring patterns.'],
        ['super sonic|rings drain', 'Transformation costs 50 rings and drains 1 per second—toggle when stages are open and fast.'],
      ],
    },
    {
      id: 'mega-man-x',
      title: 'Mega Man X',
      platform: 'SNES',
      year: '1993',
      version: 'Maverick Hunter',
      art: '',
      banner: '',
      description: 'Action-platformer with dash mobility, armor upgrades, and boss weapon weaknesses.',
      tips: [
        'Get the Dash Boots in Chill Penguin’s stage first.',
        'Use Storm Tornado against Launch Octopus and Sting Chameleon.',
        'Heart Tanks and Sub-Tanks massively boost survivability.',
      ],
      faq: [
        { q: 'Where is the Hadouken capsule?', a: 'After all upgrades, revisit Armored Armadillo and take the final cart jump with full health multiple times until the capsule appears.' },
        { q: 'Easy weakness order?', a: 'Chill Penguin → Spark Mandrill → Armored Armadillo → Launch Octopus → Boomer Kuwanger → Sting Chameleon → Storm Eagle → Flame Mammoth.' },
      ],
      kb: [
        ['dash boots|chill penguin', 'Find the boots in Chill Penguin’s stage to unlock dashing and wall kicks.'],
        ['hadouken|armored armadillo', 'Full upgrades and repeated final jump in Armored Armadillo reveal the Hadouken capsule.'],
      ],
    },
    {
      id: 'sotn',
      title: 'Castlevania: Symphony of the Night',
      platform: 'PlayStation',
      year: '1997',
      version: 'Dracula\'s Castle',
      art: '',
      banner: '',
      description: 'Exploratory action RPG with relics, inverted castle, and a wide arsenal of spells and weapons.',
      tips: [
        'Buy the Jewel of Open early to access more areas.',
        'Use the Shield Rod + Alucard Shield combo for survivability.',
        'Explore thoroughly to reveal the inverted castle trigger (Silver/Gold Rings).',
      ],
      faq: [
        { q: 'How to reach the inverted castle?', a: 'Equip the Silver and Gold Rings, visit the clock room, then defeat Richter with the Holy Glasses equipped.' },
        { q: 'Good early weapon?', a: 'The Short Sword upgrade Rapier and the Stopwatch sub-weapon carry early zones; get Jewel Knuckles in the Alchemy Lab.' },
      ],
      kb: [
        ['inverted castle|richter|holy glasses', 'Wear the Silver/Gold Rings to reveal the clock room path, then keep Richter alive using Holy Glasses.'],
        ['shield rod|alucard shield', 'Equip together for a powerful defensive buff that trivializes many fights.'],
      ],
    },
  ];

  let currentGameId = null;
  
  // Per-game randomized welcome messages
  const welcomePool = {
    generic: [
      "Hi there! Select a game to get tailored help.",
      "Welcome to RetroHub! Pick a game and ask for tips or a walkthrough.",
      "Need guidance? Choose a title and start asking questions!",
    ],
    'chrono-trigger': [
      "Crono and friends are ready—ask about techs, endings, or era routes.",
      "Want guidance on Magus, Black Omen, or side quests?",
      "Need a route for multiple endings or fast TP?",
    ],
    'super-metroid': [
      "Zebes awaits—ask about suits, bosses, or sequence breaks.",
      "Need help with wall jumps, mockball, or item routes?",
      "Stuck in Wrecked Ship or Maridia? I can guide you.",
    ],
    'link-to-the-past': [
      "Hyrule help—dungeon order, key items, or Dark World routes.",
      "Need Flute, medallions, or heart piece tips?",
      "Ask about bosses, fast travel, or secret caves.",
    ],
    'sonic-2': [
      "Speedrun or casual? Ask about Chaos Emeralds or ring routes.",
      "Need Special Stage help or boss tips?",
      "Looking to unlock Super Sonic efficiently?",
    ],
    'mega-man-x': [
      "Maverick order, Heart Tanks, or armor pieces—ask away.",
      "Need weaknesses or Hadouken capsule steps?",
      "Want a fast route to dash boots and upgrades?",
    ],
    'sotn': [
      "Castle tips—relics, rings, and inverted path questions welcome.",
      "Need a good farm spot or weapon suggestion?",
      "Ask about Richter, Holy Glasses, or map completion.",
    ],
  };

  function randomWelcome(id){
    const arr = welcomePool[id] || welcomePool.generic;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function resetChatWithWelcome(gameId){
    chatbox.innerHTML = '';
    const greeting = randomWelcome(gameId);
    const li = document.createElement('li');
    li.className = 'chat incoming';
    const opening = 'Welcome to RetroHub! Ask anything about your chosen game.\n\n';
    li.innerHTML = `<img src="${RETROBOT_AVATAR}" alt="RetroBot" class="chat-avatar" /><p>${opening}${greeting}</p>`;
    chatbox.appendChild(li);
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }

  // Utility: localStorage helpers
  const storageKey = (gameId) => `forum:${gameId}`;
  const loadPosts = (gameId) => {
    try{ return JSON.parse(localStorage.getItem(storageKey(gameId)) || '[]'); }catch{ return []; }
  };
  const savePosts = (gameId, posts) => {
    localStorage.setItem(storageKey(gameId), JSON.stringify(posts.slice(0, 200))); // cap
  };

  // Ensure we start at the top after each route change
  function resetScrollTop(){
    // Do it on next frame to allow layout to settle
    requestAnimationFrame(() => {
      try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { window.scrollTo(0, 0); }
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
    'sotn': '',
  };

  // New: gameplay GIFs for the hero area (inside pages)
  const gameplayGifMap = {
    'chrono-trigger': '',
    'super-metroid': '',
    'link-to-the-past': '',
    'sonic-2': '',
    'mega-man-x': '',
    'sotn': '',
  };

  // Render Home Grid
  function renderHome(){
    grid.innerHTML = '';
    // Theme: Home (light red/white)
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    document.body.classList.add('theme-home');
  // Reset chatbot with generic welcome on Home
  resetChatWithWelcome(null);
    games.forEach(g => {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('role','listitem');
      const thumbStyle = g.art ? `style="background-image:url('${g.art}')"` : '';
      const platformClass = (g.platform || '').toLowerCase().includes('3ds') ? 'threeds'
        : (g.platform || '').toLowerCase().includes('gba') ? 'gba'
        : (g.platform || '').toLowerCase().includes('ds') ? 'ds'
        : '';
      card.innerHTML = `
        <div class="thumb" ${thumbStyle}></div>
        <div class="body">
          <div class="title">${g.title}</div>
          <div class="chips">
            <span class="chip chip-platform ${platformClass}">${g.platform}</span>
            <span class="chip">${g.year}</span>
          </div>
          <button class="cta" data-open="${g.id}">Open</button>
        </div>
      `;
      // Hover GIF preview per game (Home only)
      const thumb = card.querySelector('.thumb');
      const originalUrl = g.art || '';
  const gifUrl = gameGifMap[g.id] || '';
      let hoverToken = 0;
      const applyBg = (url) => { thumb.style.backgroundImage = url ? `url('${url}')` : ''; };
      card.addEventListener('pointerenter', () => {
        hoverToken += 1;
        const token = hoverToken;
        if(!gifUrl) return;
        const img = new Image();
        img.onload = () => { if(token === hoverToken) applyBg(gifUrl); };
        img.onerror = () => { /* keep original if missing */ };
        img.src = gifUrl;
      });
      card.addEventListener('pointerleave', () => {
        hoverToken += 1;
        applyBg(originalUrl);
      });
      // Keyboard accessibility: focus shows preview; blur restores
      card.addEventListener('focusin', () => {
        if(!gifUrl) return;
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
  function renderGame(game){
    currentGameId = game.id;
    // Apply per-game theme
    const themeMap = {
      'chrono-trigger': 'theme-fire-red',
      'super-metroid': 'theme-emerald',
      'link-to-the-past': 'theme-heart-gold',
      'sonic-2': 'theme-platinum',
      'mega-man-x': 'theme-black-2',
      'sotn': 'theme-y',
    };
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    document.body.classList.add(themeMap[game.id] || 'theme-home');
    gameTitle.textContent = game.title;
      // Use gameplay GIF in the hero art
      const heroUrl = gameplayGifMap[game.id] || '';
      if (heroUrl) {
        gameArt.classList.remove('no-image');
        gameArt.style.backgroundImage = `url('${heroUrl}')`;
      } else {
        gameArt.style.backgroundImage = '';
        gameArt.classList.add('no-image');
      }
    gamePlatform.textContent = game.platform;
    gameYear.textContent = game.year;
    gameVersion.textContent = game.version;
    gameDescription.textContent = game.description;
    chatSubtitle.textContent = `Chatting about: ${game.title}`;
  // Reset chatbot with a per-game randomized welcome
  resetChatWithWelcome(game.id);

    // Region Map panel (uses existing banner URL if provided)
    const mapPanel = document.getElementById('map-panel');
    const mapImg = document.getElementById('map-image');
    const mapLink = document.getElementById('map-link');
    const mapUrl = game.banner || '';
    if(mapUrl){
      mapPanel.style.display = '';
      mapImg.src = mapUrl;
      mapImg.alt = `${game.title} — Region map`;
      mapLink.href = mapUrl;
      // Map modal: open on click instead of navigating away
      const modal = document.getElementById('map-modal');
      const modalImg = document.getElementById('map-modal-image');
      const modalDownload = document.getElementById('map-download');
      const setHidden = (hidden) => modal.setAttribute('aria-hidden', hidden ? 'true' : 'false');
      const openMap = (e) => {
        e.preventDefault();
        modalImg.src = mapUrl;
        modalDownload.href = mapUrl;
        setHidden(false);
      };
      const closeMap = () => setHidden(true);
      mapLink.onclick = openMap;
      modal.querySelectorAll('[data-close-map]').forEach(el => el.onclick = closeMap);
      window.addEventListener('keydown', (ev) => { if(ev.key === 'Escape') closeMap(); }, { once: true });
    } else {
      mapPanel.style.display = 'none';
      mapImg.removeAttribute('src');
      mapLink.removeAttribute('href');
    }

    // Tips
    tipsList.innerHTML = '';
    game.tips.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      tipsList.appendChild(li);
    });

    // FAQ
    faqList.innerHTML = '';
    game.faq.forEach(({q,a}) => {
      const d = document.createElement('details');
      const s = document.createElement('summary'); s.textContent = q; d.appendChild(s);
      const p = document.createElement('p'); p.textContent = a; d.appendChild(p);
      faqList.appendChild(d);
    });

    // Forum posts
    renderPosts();
  }

  function renderPosts(){
    postsEl.innerHTML = '';
    const posts = loadPosts(currentGameId);
    if(!posts.length){
      const empty = document.createElement('li');
      empty.className = 'post';
      empty.innerHTML = '<div class="bubble"><div class="text">No posts yet. Be the first to share a tip or ask a question!</div></div>';
      postsEl.appendChild(empty);
      return;
    }
    posts.forEach(p => {
      const li = document.createElement('li');
      li.className = 'post';
      li.innerHTML = `
        <div class="meta"><span>${p.name || 'Anon'}</span><span>•</span><span>${new Date(p.ts).toLocaleString()}</span></div>
        <div class="bubble"><div class="text"></div></div>
      `;
      li.querySelector('.text').textContent = p.text;
      postsEl.appendChild(li);
    });
  }

  // Forum submit
  postForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = postText.value.trim();
    if(!text || !currentGameId) return;
    const posts = loadPosts(currentGameId);
    posts.unshift({ name: postName.value.trim(), text, ts: Date.now() });
    savePosts(currentGameId, posts);
    postText.value = '';
    renderPosts();
  });

  // Simple Router
  function navigateTo(hash){
    window.location.hash = hash;
  }
  function onRoute(){
    const hash = window.location.hash || '#/';
    const parts = hash.slice(2).split('/').filter(Boolean);
    // Update active nav link state
    const markActive = (route) => {
      document.querySelectorAll('.nav-link').forEach(a => {
        const href = a.getAttribute('href');
        if((route === 'home' && href === '#/') || (route === 'about' && href === '#/about')){
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      });
    };
    if(parts.length === 0){
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
      if(id === 'about'){
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
      const game = games.find(g => g.id === id);
      if(game){
        aboutView.classList.remove('active');
        homeView.classList.remove('active');
        gameView.classList.add('active');
        renderGame(game);
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
  window.addEventListener('hashchange', onRoute);

  // Back and Jump actions
  backBtn.addEventListener('click', () => navigateTo('#/'));
  openChat.addEventListener('click', () => {
    document.body.classList.add('show-chatbot');
    if(!authToken && !authPromptShown){ promptSignInWithRetroBot(); }
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
    chatLi.innerHTML = className === 'outgoing'
      ? `<p>${message}</p>`
      : `<img src="${RETROBOT_AVATAR}" alt="RetroBot" class="chat-avatar" /><p>${message}</p>`;
    return chatLi;
  };

  // Randomized RetroBot persona messages to prompt sign-in
  function getRetroBotSignInMessage(){
    const options = [
      'Sign in to save your posts and sync across devices.',
      'Sign in to keep your chat context and forum posts.',
      'Create an account to sync tips and bookmarks.',
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Show a RetroBot-styled sign-in prompt and open the login modal
  function promptSignInWithRetroBot(replaceEl){
    const msg = getRetroBotSignInMessage();
    if(replaceEl){
      const p = replaceEl.querySelector('p');
      if(p) p.textContent = msg;
    } else if(!authPromptShown){
      const incoming = createChatLi(msg, 'incoming');
      chatbox.appendChild(incoming);
      chatbox.scrollTo(0, chatbox.scrollHeight);
    }
    authPromptShown = true;
    openAuthModal();
    setTimeout(() => authEmail?.focus(), 50);
  }

  // Build a strong domain-constrained prompt with per-game context
  function buildPrompt(userText){
    const game = games.find(g => g.id === currentGameId);
    const title = game?.title || 'Retro game';
    const platform = game?.platform || 'Various';
    const year = game?.year || '';
    const version = game?.version || '';
    const description = game?.description || '';
    const tips = (game?.tips || []).map(t => `- ${t}`).join('\n');
    const faqs = (game?.faq || []).map(f => `- Q: ${f.q}\n  A: ${f.a}`).join('\n');

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

  const generateResponse = async (chatElement) => {
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
      if(response.status === 401){
        promptSignInWithRetroBot(chatElement);
        return;
      }
      const data = await response.json();
      if(!response.ok){
        const msg = data?.error?.message || response.statusText || 'Request failed';
        throw new Error(msg);
      }
      const text = (data?.text || '').replace(/\*\*(.*?)\*\*/g, '$1');
      messageElement.textContent = text || 'No response received. Try again.';
      // After rendering the answer, go to the TOP of this message (not the bottom)
      try { chatElement.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      catch { chatbox.scrollTop = Math.max(0, chatElement.offsetTop - 8); }
    } catch (error) {
      messageElement.classList.add('error');
      const hint = 'If you are running locally, ensure the server is started and GEMINI_API_KEY is set in .env';
      messageElement.textContent = (error.message || 'Error contacting Gemini API') + '\n' + hint;
      // Ensure the user sees the start of the error message
      try { chatElement.scrollIntoView({ behavior: 'auto', block: 'start' }); }
      catch { chatbox.scrollTop = Math.max(0, chatElement.offsetTop - 8); }
    }
  };

  function handleChat(){
    userMessage = chatInput.value.trim();
    if(!userMessage) return;
    if(!authToken){
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
    if(!authToken && chatInput.value.trim() && !authPromptShown){
      document.body.classList.add('show-chatbot');
      promptSignInWithRetroBot();
    }
  });
  chatInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && !e.shiftKey && window.innerWidth > 800){
      e.preventDefault();
      handleChat();
    }
  });
  sendChatBtn.addEventListener('click', handleChat);
  closeBtn.addEventListener('click', () => document.body.classList.remove('show-chatbot'));
  chatbotToggler.addEventListener('click', () => {
    document.body.classList.toggle('show-chatbot');
    if(document.body.classList.contains('show-chatbot') && !authToken && !authPromptShown){
      promptSignInWithRetroBot();
    }
  });

  // --- Auth UI wiring ---
  updateAuthUI();
  authBtn?.addEventListener('click', () => {
    if(authUser){
      setAuth(null, '');
    } else {
      openAuthModal();
      setTimeout(() => authEmail?.focus(), 50);
    }
  });
  authModal?.querySelectorAll('[data-auth-close]')?.forEach(el => el.addEventListener('click', closeAuthModal));
  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (authEmail?.value || '').trim();
    const password = (authPass?.value || '').trim();
    if(!email || !password) return;
    try{
      const resp = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const payload = await resp.json();
      if(!resp.ok){ throw new Error(payload?.error || 'Login failed'); }
  setAuth(payload.user, payload.token);
  authPromptShown = false;
      closeAuthModal();
    } catch(err){
      alert((err && err.message) || 'Login failed');
    }
  });

  // Initial render
  renderHome();
  onRoute();
  // Try to hydrate auth chip from server token if present (optional)
  if(authToken && !authUser){
    try {
      fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${authToken}` } })
        .then(r => r.json())
        .then(data => { if(data?.user){ setAuth(data.user, authToken); } });
    } catch {}
  }
});
