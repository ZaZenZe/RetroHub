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
  // Chat avatar asset (Professor Oak)
  const OAK_AVATAR = 'assets/PikPng.com_professor-oak-png_1480585.png';
  // Persona toggle: when true, the bot speaks as Prof. Oak
  const OAK_PERSONA = true;
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
      id: 'fire-red',
      title: 'Pokémon Fire Red',
      platform: 'GBA',
      year: '2004',
      version: 'Kanto',
      art: 'assets/box art/640px-FireRed_EN_boxart.png',
  banner: 'assets/map/red.png',
      description: 'Return to Kanto in this remake of the original adventure. Catch, train, and battle across iconic towns and routes.',
      tips: [
        'Pick Bulbasaur for an easier early-game vs. Brock and Misty.',
        'Catch a Flying-type early for utility (e.g., Pidgey).',
        'Use the Vs. Seeker to level efficiently on known trainers.',
      ],
      faq: [
        { q: 'Where to get the VS Seeker?', a: 'Route 24/25 area: Receive it from the aide after leaving the Underground Path house near Vermilion City (after getting the Bike Voucher).' },
        { q: 'How to get Flash for Rock Tunnel?', a: 'Catch at least 10 Pokémon and visit Professor Oak’s aide on Route 2 (south of Pewter via Diglett’s Cave) to receive HM05 Flash.' },
      ],
      kb: [
        ['starter|best|begin', 'Bulbasaur makes the first two gyms easier; Charmander is harder early but great late-game.'],
        ['vs seeker|level|grind', 'Use the Vs. Seeker on routes with easy rematches; heal between cycles for fast EXP.'],
        ['flash|hm05|rock tunnel', 'Get HM05 Flash from Oak’s aide on Route 2 after catching 10 Pokémon.'],
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
      faq: [
        { q: 'How to access Battle Frontier?', a: 'Beat the Champion and complete the main story; then travel to the Battle Frontier via the ferry from Slateport or Lilycove.' },
        { q: 'Good EXP spots before Elite Four?', a: 'Victory Road trainers and Elite Four rematches; also use Exp. Share on lower-level team members.' },
      ],
      kb: [
        ['battle frontier|symbols|facilities', 'The Battle Frontier has multiple facilities; plan sets specifically for each (e.g., Speed control for Battle Tower).'],
        ['surf|hm|progress', 'HM Surf is obtained from Wally’s uncle in Petalburg after beating the Petalburg Gym.'],
      ],
    },
    {
      id: 'heart-gold',
      title: 'Pokémon Heart Gold',
      platform: 'DS',
      year: '2009',
      version: 'Johto + Kanto',
      art: 'assets/box art/1200px-HeartGold_EN_boxart.jpg',
      banner: 'assets/map/gold.jpg',
      description: 'Remake of Gold with Pokéwalker support and a full Kanto post-game.',
      tips: [
        'Train a diverse team for Whitney’s Miltank (use status or Fighting).',
        'Use Headbutt trees for early captures like Heracross.',
      ],
      faq: [
        { q: 'How to beat Whitney?', a: 'Use a Fighting-type or apply status (Sleep/Paralysis). Disable Rollout with Ghost-types or Attract immunity (female Pokémon).' },
        { q: 'Where to get Exp. Share?', a: 'Mr. Pokémon on Route 30 after getting the Red Scale from the shiny Gyarados.' },
      ],
      kb: [
        ['whitney|miltank|rollout', 'Counter with Fighting moves, status, or a Ghost-type to block Stomp/Attract synergies.'],
        ['red scale|exp share|mr. pokemon', 'Trade Red Scale to Mr. Pokémon on Route 30 to receive Exp. Share.'],
      ],
    },
    {
      id: 'platinum',
      title: 'Pokémon Platinum',
      platform: 'DS',
      year: '2008',
      version: 'Sinnoh',
      art: 'assets/box art/Platinum_EN_boxart.png',
      banner: 'assets/map/platinum.png',
      description: 'Enhanced Sinnoh adventure with Distortion World and better dex variety.',
      tips: [
        'Chimchar helps with early gyms; consider a Water/Ground like Gastrodon later.',
        'Use the Vs. Seeker and Amity Square for happiness evolutions.',
      ],
      faq: [
        { q: 'How to reach Distortion World?', a: 'Progress through the story until Spear Pillar, then follow Cynthia; the plot will lead you there.' },
        { q: 'Good team balance idea?', a: 'Fire/Fighting (Infernape), Water/Ground (Gastrodon), Electric (Luxray), Flying (Staraptor), Psychic (Alakazam), Ice (Weavile) as a sample.' },
      ],
      kb: [
        ['distortion world|giratina', 'Triggered via story after Spear Pillar events; complete puzzles with rotating platforms.'],
        ['amity square|happiness|evolve', 'Walk with certain Pokémon to boost happiness; also use Soothe Bell.'],
      ],
    },
    {
      id: 'black-2',
      title: 'Pokémon Black 2',
      platform: 'DS',
      year: '2012',
      version: 'Unova',
      art: 'assets/box art/pokemon-black-2---button-1558054992410.jpg',
      banner: 'assets/map/Unova_B2W2_alt.png',
      description: 'Sequel in Unova with new areas, Join Avenue, and challenge modes.',
      tips: [
        'Use the Habitat List to track encounters and complete the Pokédex.',
        'Join Avenue boosts shops and services—visit often to level it up.',
      ],
      faq: [
        { q: 'Where to get Shiny Charm?', a: 'Complete the National Pokédex and then talk to Professor Juniper to receive it.' },
        { q: 'Good EXP spots?', a: 'Audino shaking grass and repeated trainer battles with Lucky Egg help significantly.' },
      ],
      kb: [
        ['join avenue|shops|level', 'Interact with visitors to level Join Avenue and unlock better services.'],
        ['lucky egg|exp|audino', 'Use Lucky Egg and fight Audino in shaking grass for fast EXP.'],
      ],
    },
    {
      id: 'y',
      title: 'Pokémon Y',
      platform: '3DS',
      year: '2013',
      version: 'Kalos',
      art: 'assets/box art/Pokemon-Y.avif',
      banner: 'assets/map/pokemon-x-y.jpg',
      description: 'First 3D mainline Pokémon with Mega Evolution and a stylish Kalos region.',
      tips: [
        'Use Exp. Share to keep your team even; game pacing assumes it.',
        'Try Mega Evolutions mid-game for big power spikes.',
      ],
      faq: [
        { q: 'How to get Mega Ring?', a: 'Progress the story to earn the Mega Ring in Shalour City after the Tower of Mastery events.' },
        { q: 'Good early team idea?', a: 'Starter (Froakie or Fennekin), Fletchling, Bunnelby (Pickup), and an Electric like Pikachu or Helioptile.' },
      ],
      kb: [
        ['mega ring|mega evolve', 'You obtain the Mega Ring in Shalour City after the Tower of Mastery, enabling Mega Evolutions in battle.'],
        ['exp share|level|balance', 'Kalos balances around Exp. Share being ON; toggle off if you want more challenge.'],
      ],
    },
  ];

  let currentGameId = null;
  
  // Per-game randomized welcome messages
  const welcomePool = {
    generic: [
      "Hi there! Select a game to get tailored help.",
      "Welcome! Pick a game and ask for tips or a walkthrough.",
      "Need guidance? Choose a game and start asking questions!",
    ],
    'fire-red': [
      "Welcome to Kanto! Ask about gyms, routes, or items like the VS Seeker.",
      "Fire Red tips ready—starters, Brock & Misty strats, or where to find Flash.",
      "Got questions for Kanto? Teams, badges, or leveling—ask away!",
    ],
    'emerald': [
      "Hoenn time! Ask about gyms, Team Aqua/Magma, or the Battle Frontier.",
      "Emerald tips: double battles, good early team picks, or EXP spots.",
      "Want Battle Frontier pointers or story progression help?",
    ],
    'heart-gold': [
      "Johto awaits! Ask about Whitney’s Miltank or where to get Exp. Share.",
      "Need help with Johto gyms or Kanto post-game?",
      "Heart Gold tips—routes, items, and gym strategies.",
    ],
    'platinum': [
      "Sinnoh tips here! Distortion World, team ideas, or leveling routes.",
      "Platinum help: gym counters, Giratina path, or dex variety.",
      "Ask about Sinnoh travel, items, or story beats.",
    ],
    'black-2': [
      "Unova guidance: Join Avenue, EXP farming, or story routes.",
      "Black 2 tips—Habitat List, Lucky Egg, or team balance.",
      "Need help with challenge modes or gym plans?",
    ],
    'y': [
      "Kalos help ready! Mega Ring, team comps, or gym counters.",
      "Pokémon Y tips—Exp. Share pacing, Megas, or early-game teams.",
      "Ask about routes, items, or where to go next in Kalos.",
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
  const opening = 'Hello there! Welcome to the world of Pokémon!\n\n';
    li.innerHTML = `<img src="${OAK_AVATAR}" alt="Professor Oak" class="chat-avatar" /><p>${opening}${greeting}</p>`;
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
    'fire-red': 'assets/game/fire-red.gif',
    'emerald': 'assets/game/pokemon-emerald.gif',
    'heart-gold': 'assets/game/heart-gold.gif',
    'platinum': 'assets/game/platinum.gif',
    'black-2': 'assets/game/black2.gif',
    'y': 'assets/game/y.gif',
  };

  // New: gameplay GIFs for the hero area (inside pages)
  const gameplayGifMap = {
    'fire-red': 'assets/gameplay/pokemon-fire-red.gif',
    'emerald': 'assets/gameplay/emerald.gif',
    'heart-gold': 'assets/gameplay/heartgold.gif',
    'platinum': 'assets/gameplay/platinum.gif',
    'black-2': 'assets/gameplay/black2.gif',
    'y': 'assets/gameplay/y.gif',
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
      'fire-red': 'theme-fire-red',
      'emerald': 'theme-emerald',
      'heart-gold': 'theme-heart-gold',
      'platinum': 'theme-platinum',
      'black-2': 'theme-black-2',
      'y': 'theme-y',
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
    if(!authToken && !authPromptShown){ promptSignInWithOak(); }
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
      : `<img src="${OAK_AVATAR}" alt="Professor Oak" class="chat-avatar" /><p>${message}</p>`;
    return chatLi;
  };

  // Randomized Oak persona messages to prompt sign-in
  function getOakSignInMessage(){
    const options = [
      "Ah! You'll need to sign in at my lab before we can chat.",
      "Hold on, Trainer! Please sign in so I can assist you properly.",
      "Hm! Access denied—sign in first, then I'll help you out.",
      "Aha! I recognize keen curiosity—sign in, and let's begin.",
      "Patience! Sign in to sync your Trainer Card, then ask away.",
      "Safety first! Please sign in so I can share proper guidance."
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Show an Oak-styled sign-in prompt and open the login modal
  function promptSignInWithOak(replaceEl){
    const msg = getOakSignInMessage();
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
    const title = game?.title || 'Pokémon (series)';
    const platform = game?.platform || 'Various';
    const year = game?.year || '';
    const version = game?.version || '';
    const description = game?.description || '';
    const tips = (game?.tips || []).map(t => `- ${t}`).join('\n');
    const faqs = (game?.faq || []).map(f => `- Q: ${f.q}\n  A: ${f.a}`).join('\n');

  const persona = OAK_PERSONA ? `You are Professor Oak speaking to the player. Keep a warm, mentor-like tone. Use first-person briefly when helpful ("I"/"my lab"), but stay concise and practical. Do not roleplay long monologues.` : `You are Pokémon Helper Bot.`;
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

  const generateResponse = async (chatElement) => {
    const messageElement = chatElement.querySelector('p');
    const requestOptions = {
      method: 'POST',
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      ),
      body: JSON.stringify({ prompt: buildPrompt(userMessage) })
    };
    try {
      const response = await fetch(API_URL, requestOptions);
      if(response.status === 401){
        promptSignInWithOak(chatElement);
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
    } finally {
      // Do not auto-jump to the very bottom; keep view at the top of the new message
    }
  };

  function handleChat(){
    userMessage = chatInput.value.trim();
    if(!userMessage) return;
    if(!authToken){
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
    if(!authToken && chatInput.value.trim() && !authPromptShown){
      document.body.classList.add('show-chatbot');
      promptSignInWithOak();
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
      promptSignInWithOak();
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
