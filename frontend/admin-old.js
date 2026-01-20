// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = '/api';
  
  // Auth state
  let authToken = localStorage.getItem('authToken') || '';
  let authUser = null;
  
  try {
    authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch {
    authUser = null;
  }
  
  // Check if user is admin or mod
  if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'mod')) {
    window.location.href = '/index.html';
    return;
  }
  
  // Elements
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  
  const navBtns = $$('.nav-btn');
  const views = $$('.admin-view');
  const logoutBtn = $('#logout-btn');
  const adminUsername = $('#admin-username');
  const panelTitle = $('#panel-title');
  const panelSubtitle = $('#panel-subtitle');
  const navCreate = $('#nav-create');
  
  // Games view
  const gamesSearch = $('#games-search');
  const gamesPlatformFilter = $('#games-platform-filter');
  const gamesList = $('#games-list');
  const gamesLoading = $('#games-loading');
  const gamesEmpty = $('#games-empty');
  
  // Form view
  const gameForm = $('#game-form');
  const formTitle = $('#form-title');
  const cancelEditBtn = $('#cancel-edit-btn');
  const deleteGameBtn = $('#delete-game-btn');
  const gameIdInput = $('#game-id');
  const gameTitleInput = $('#game-title');
  const gameSlugInput = $('#game-slug');
  const gamePlatformInput = $('#game-platform');
  const gameYearInput = $('#game-year');
  const gameVersionInput = $('#game-version');
  const gameDescriptionInput = $('#game-description');
  const gameCoverInput = $('#game-cover');
  const gameCoverGifInput = $('#game-cover-gif');
  const gameHeroInput = $('#game-hero');
  const gameGameplayGifInput = $('#game-gameplay-gif');
  const gameHoverInput = $('#game-hover');
  const gameHoverGifInput = $('#game-hover-gif');
  const gameScreenshotsInput = $('#game-screenshots');
  const themePresetSelect = $('#theme-preset');
  const themeNameInput = $('#theme-name');
  const colorPrimaryInput = $('#color-primary');
  const colorPrimaryAltInput = $('#color-primary-alt');
  const colorAccentInput = $('#color-accent');
  const colorBackgroundInput = $('#color-background');
  const colorCardInput = $('#color-card');
  const colorTextInput = $('#color-text');
  const colorBorderInput = $('#color-border');
  const tipsListEl = $('#tips-list');
  const faqsListEl = $('#faqs-list');
  const addTipBtn = $('#add-tip-btn');
  const addFaqBtn = $('#add-faq-btn');
  const bulkUploadBtn = $('#bulk-upload-btn');
  const modsListEl = $('#mods-list');
  const modLookupInput = $('#mod-lookup');
  const addModBtn = $('#add-mod-btn');
  
  // Upload modal
  const uploadModal = $('#upload-modal');
  const uploadForm = $('#upload-form');
  const uploadFile = $('#upload-file');
  const uploadPreview = $('#upload-preview');
  
  // Notification
  const notification = $('#notification');
  
  // State
  const isAdmin = authUser.role === 'admin';
  let currentGameId = null;
  let uploadTarget = null;
  let tips = [];
  let faqs = [];
  let mods = [];
  const themePresets = [
    {
      name: 'retro',
      label: 'Retro Classic',
      colors: {
        primary: '#ff7b00',
        primaryAlt: '#ff9f1a',
        accent: '#4fc3f7',
        background: '#0d0e12',
        card: '#1b1f29',
        text: '#e6e6e9',
        border: '#232734',
      },
    },
    {
      name: 'fire-red',
      label: 'Fire Red',
      colors: {
        primary: '#ff5e3a',
        primaryAlt: '#ff7452',
        accent: '#ffd700',
        background: '#1a0a0a',
        card: '#2a1515',
        text: '#ffe6e6',
        border: '#3d1f1f',
      },
    },
    {
      name: 'emerald',
      label: 'Emerald Green',
      colors: {
        primary: '#2ecc71',
        primaryAlt: '#27ae60',
        accent: '#a8e6cf',
        background: '#0a1a0a',
        card: '#152a15',
        text: '#e6ffe6',
        border: '#1f3d1f',
      },
    },
    {
      name: 'platinum',
      label: 'Platinum Silver',
      colors: {
        primary: '#95a5a6',
        primaryAlt: '#bdc3c7',
        accent: '#3498db',
        background: '#0f0f14',
        card: '#1a1a24',
        text: '#e8e8f0',
        border: '#2a2a38',
      },
    },
    {
      name: 'heart-gold',
      label: 'Heart Gold',
      colors: {
        primary: '#f39c12',
        primaryAlt: '#f1c40f',
        accent: '#e74c3c',
        background: '#1a1410',
        card: '#2a2218',
        text: '#fff5e6',
        border: '#3d3425',
      },
    },
  ];
  
  // Initialize
  adminUsername.textContent = authUser.name || authUser.email || 'Admin';
  panelTitle.textContent = isAdmin ? 'Admin Panel' : 'Moderator Panel';
  panelSubtitle.textContent = isAdmin
    ? 'Manage games, content, and moderators'
    : 'Manage the games assigned to you';
  if (!isAdmin && navCreate) {
    navCreate.hidden = true;
  }
  
  // API helper
  async function apiJson(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
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
      if (resp.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        window.location.href = '/index.html';
        return;
      }
      throw err;
    }
    
    return payload || {};
  }
  
  async function apiFormData(path, formData) {
    const resp = await fetch(path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }
    
    return resp.json();
  }
  
  // Notifications
  function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.hidden = false;
    
    setTimeout(() => {
      notification.hidden = true;
    }, 4000);
  }
  
  // Navigation
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewName = btn.dataset.view;
      if (viewName === 'create') {
        resetForm();
        switchView('create');
      } else {
        switchView(viewName);
      }
    });
  });
  
  function switchView(viewName, options = {}) {
    const { preserveForm = false } = options;
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    views.forEach(view => {
      view.classList.toggle('active', view.id === `${viewName}-view`);
    });
    
    if (viewName === 'games') {
      loadGames();
    } else if (viewName === 'create' && !preserveForm) {
      resetForm();
    }
  }
  
  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.href = '/index.html';
  });
  
  // Load games
  async function loadGames() {
    gamesLoading.hidden = false;
    gamesEmpty.hidden = true;
    gamesList.innerHTML = '';
    
    try {
      const query = gamesSearch.value.trim();
      const platform = gamesPlatformFilter.value;
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (platform) params.append('platform', platform);
      params.append('limit', '100');
      
      const data = await apiJson(`${API_BASE}/games/admin/games?${params}`);
      const games = data.games || [];
      
      gamesLoading.hidden = true;
      
      if (games.length === 0) {
        gamesEmpty.hidden = false;
        return;
      }
      
      games.forEach(game => {
        const item = document.createElement('div');
        item.className = 'game-item';
        item.innerHTML = `
          <img src="${game.coverImageUrl || '/assets/pokeball.png'}" alt="${game.title}" class="game-thumb" />
          <div class="game-info">
            <h3>${game.title}</h3>
            <div class="game-meta">
              <span class="chip">${game.platform}</span>
              <span class="chip">${game.releaseYear}</span>
              ${game.versionLabel ? `<span class="chip">${game.versionLabel}</span>` : ''}
              <span class="chip">${game.theme?.name || 'retro'}</span>
            </div>
            <p style="font-size: 13px; color: var(--admin-muted); margin: 4px 0 0;">${game.description.substring(0, 100)}...</p>
          </div>
          <div class="game-actions">
            <button class="cta secondary" onclick="editGame('${game._id || game.id}')">Edit</button>
            <button class="cta danger" onclick="confirmDeleteGame('${game._id || game.id}', '${game.title.replace(/'/g, "\\'")}')">Delete</button>
          </div>
        `;
        gamesList.appendChild(item);
      });
    } catch (err) {
      gamesLoading.hidden = true;
      showNotification(`Failed to load games: ${err.message}`, 'error');
    }
  }
  
  // Search/filter
  gamesSearch.addEventListener('input', debounce(loadGames, 300));
  gamesPlatformFilter.addEventListener('change', loadGames);
  
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
  // Edit game
  window.editGame = async function(gameId) {
    try {
      const data = await apiJson(`${API_BASE}/games/admin/games/${gameId}`);
      const game = data.game;
      
      currentGameId = gameId;
      formTitle.textContent = 'Edit Game';
      deleteGameBtn.hidden = false;
      
      // Populate form
      gameIdInput.value = game._id || game.id;
      gameTitleInput.value = game.title;
      gameSlugInput.value = game.slug;
      gamePlatformInput.value = game.platform;
      gameYearInput.value = game.releaseYear;
      gameVersionInput.value = game.versionLabel || '';
      gameDescriptionInput.value = game.description;
      gameCoverInput.value = game.coverImageUrl || '';
      gameCoverGifInput.value = game.coverGifUrl || '';
      gameHeroInput.value = game.heroImageUrl || '';
      gameGameplayGifInput.value = game.gameplayGifUrl || '';
      gameHoverInput.value = game.hoverImageUrl || '';
      gameHoverGifInput.value = game.hoverGifUrl || '';
      gameScreenshotsInput.value = (game.screenshots || []).join('\n');

      // Theme
      const theme = game.theme || {};
      if (themePresetSelect) {
        themePresetSelect.value = theme.name || '';
      }
      themeNameInput.value = theme.name || 'retro';
      const colors = theme.colors || {};
      colorPrimaryInput.value = colors.primary || '#ff7b00';
      colorPrimaryAltInput.value = colors.primaryAlt || '#ff9f1a';
      colorAccentInput.value = colors.accent || '#4fc3f7';
      colorBackgroundInput.value = colors.background || '#0d0e12';
      colorCardInput.value = colors.card || '#1b1f29';
      colorTextInput.value = colors.text || '#e6e6e9';
      colorBorderInput.value = colors.border || '#232734';
      
      // Tips & FAQs
      tips = data.tips || [];
      faqs = data.faqs || [];
      renderTips();
      renderFaqs();
      await loadMods(gameIdInput.value);
      
      // Preview images
      updateImagePreview('cover', gameCoverInput.value);
      updateImagePreview('cover-gif', gameCoverGifInput.value);
      updateImagePreview('hero', gameHeroInput.value);
      updateImagePreview('gameplay-gif', gameGameplayGifInput.value);
      updateImagePreview('hover', gameHoverInput.value);
      updateImagePreview('hover-gif', gameHoverGifInput.value);
      updateScreenshotsPreviews();
      
      switchView('create', { preserveForm: true });
    } catch (err) {
      showNotification(`Failed to load game: ${err.message}`, 'error');
    }
  };
  
  // Delete game
  window.confirmDeleteGame = function(gameId, gameTitle) {
    if (confirm(`Are you sure you want to delete "${gameTitle}"? This action cannot be undone.`)) {
      deleteGame(gameId);
    }
  };
  
  async function deleteGame(gameId) {
    try {
      await apiJson(`${API_BASE}/games/admin/games/${gameId}`, { method: 'DELETE' });
      showNotification('Game deleted successfully');
      loadGames();
      switchView('games');
    } catch (err) {
      showNotification(`Failed to delete game: ${err.message}`, 'error');
    }
  }
  
  deleteGameBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentGameId) {
      confirmDeleteGame(currentGameId, gameTitleInput.value);
    }
  });
  
  // Form submission
  gameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const gameData = {
      title: gameTitleInput.value.trim(),
      slug: gameSlugInput.value.trim(),
      platform: gamePlatformInput.value,
      releaseYear: parseInt(gameYearInput.value, 10),
      versionLabel: gameVersionInput.value.trim(),
      description: gameDescriptionInput.value.trim(),
      coverImageUrl: gameCoverInput.value.trim(),
      coverGifUrl: gameCoverGifInput.value.trim() || null,
      heroImageUrl: gameHeroInput.value.trim() || gameCoverInput.value.trim(),
      gameplayGifUrl: gameGameplayGifInput.value.trim() || null,
      hoverImageUrl: gameHoverInput.value.trim() || gameCoverInput.value.trim(),
      hoverGifUrl: gameHoverGifInput.value.trim() || null,
      screenshots: gameScreenshotsInput.value.split('\n').map(s => s.trim()).filter(Boolean),
      theme: {
        name: themeNameInput.value.trim() || 'retro',
        colors: {
          primary: colorPrimaryInput.value,
          primaryAlt: colorPrimaryAltInput.value,
          accent: colorAccentInput.value,
          background: colorBackgroundInput.value,
          card: colorCardInput.value,
          text: colorTextInput.value,
          border: colorBorderInput.value,
        },
      },
      tips: tips.map(t => ({ content: t.content, category: t.category || 'gameplay' })),
      faqs: faqs.map(f => ({ question: f.question, answer: f.answer })),
    };
    
    try {
      if (currentGameId) {
        // Update
        await apiJson(`${API_BASE}/games/admin/games/${currentGameId}`, {
          method: 'PUT',
          body: JSON.stringify(gameData),
        });
        showNotification('Game updated successfully');
      } else {
        if (!isAdmin) {
          showNotification('Only admins can create new games', 'error');
          return;
        }
        // Create
        await apiJson(`${API_BASE}/games/admin/games`, {
          method: 'POST',
          body: JSON.stringify(gameData),
        });
        showNotification('Game created successfully');
      }
      
      switchView('games');
      loadGames();
    } catch (err) {
      showNotification(`Failed to save game: ${err.message}`, 'error');
    }
  });
  
  // Auto-generate slug from title
  gameTitleInput.addEventListener('input', () => {
    if (!currentGameId) {
      const slug = gameTitleInput.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      gameSlugInput.value = slug;
    }
  });
  
  // Cancel edit
  cancelEditBtn.addEventListener('click', () => {
    switchView('games');
  });
  
  // Reset form
  function resetForm() {
    currentGameId = null;
    formTitle.textContent = isAdmin ? 'Create New Game' : 'Select a game to edit';
    deleteGameBtn.hidden = true;
    gameForm.reset();
    tips = [];
    faqs = [];
    mods = [];
    renderTips();
    renderFaqs();
    renderMods();
    
    // Reset to default theme
    themeNameInput.value = 'retro';
    colorPrimaryInput.value = '#ff7b00';
    colorPrimaryAltInput.value = '#ff9f1a';
    colorAccentInput.value = '#4fc3f7';
    colorBackgroundInput.value = '#0d0e12';
    colorCardInput.value = '#1b1f29';
    colorTextInput.value = '#e6e6e9';
    colorBorderInput.value = '#232734';
    
    $$('.image-preview').forEach(el => el.classList.remove('show'));
  }
  
  // Theme preset selection
  themePresetSelect.addEventListener('change', async () => {
    const presetName = themePresetSelect.value;
    if (!presetName) return;
    
    const preset = themePresets.find(t => t.name === presetName);
    if (preset && preset.colors) {
      themeNameInput.value = preset.name;
      colorPrimaryInput.value = preset.colors.primary;
      colorPrimaryAltInput.value = preset.colors.primaryAlt;
      colorAccentInput.value = preset.colors.accent;
      colorBackgroundInput.value = preset.colors.background;
      colorCardInput.value = preset.colors.card;
      colorTextInput.value = preset.colors.text;
      colorBorderInput.value = preset.colors.border;
    }
  });
  
  // Tips management
  addTipBtn.addEventListener('click', () => {
    tips.push({ content: '', category: 'gameplay', isNew: true });
    renderTips();
  });
  
  function renderTips() {
    tipsListEl.innerHTML = '';
    tips.forEach((tip, index) => {
      const item = document.createElement('div');
      item.className = 'content-item';
      item.innerHTML = `
        <input type="text" placeholder="Tip content" value="${tip.content || ''}" data-index="${index}" data-field="content" />
        <select data-index="${index}" data-field="category">
          <option value="gameplay" ${tip.category === 'gameplay' ? 'selected' : ''}>Gameplay</option>
          <option value="story" ${tip.category === 'story' ? 'selected' : ''}>Story</option>
          <option value="collectibles" ${tip.category === 'collectibles' ? 'selected' : ''}>Collectibles</option>
          <option value="secrets" ${tip.category === 'secrets' ? 'selected' : ''}>Secrets</option>
        </select>
        <div class="content-item-actions">
          <button type="button" class="remove-content" data-index="${index}">Remove</button>
        </div>
      `;
      tipsListEl.appendChild(item);
    });
    
    // Event listeners
    tipsListEl.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        const field = e.target.dataset.field;
        tips[index][field] = e.target.value;
      });
    });
    
    tipsListEl.querySelectorAll('.remove-content').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        tips.splice(index, 1);
        renderTips();
      });
    });
  }
  
  // FAQs management
  addFaqBtn.addEventListener('click', () => {
    faqs.push({ question: '', answer: '', isNew: true });
    renderFaqs();
  });
  
  function renderFaqs() {
    faqsListEl.innerHTML = '';
    faqs.forEach((faq, index) => {
      const item = document.createElement('div');
      item.className = 'content-item';
      item.innerHTML = `
        <input type="text" placeholder="Question" value="${faq.question || ''}" data-index="${index}" data-field="question" />
        <textarea placeholder="Answer" rows="2" data-index="${index}" data-field="answer">${faq.answer || ''}</textarea>
        <div class="content-item-actions">
          <button type="button" class="remove-content" data-index="${index}">Remove</button>
        </div>
      `;
      faqsListEl.appendChild(item);
    });
    
    // Event listeners
    faqsListEl.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        const field = e.target.dataset.field;
        faqs[index][field] = e.target.value;
      });
    });
    
    faqsListEl.querySelectorAll('.remove-content').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        faqs.splice(index, 1);
        renderFaqs();
      });
    });
  }

  async function loadMods(gameId) {
    if (!modsListEl || !gameId) return;
    modsListEl.innerHTML = '<p class="map-hint">Loading mods…</p>';
    try {
      const data = await apiJson(`${API_BASE}/games/admin/games/${gameId}/mods`);
      mods = data.mods || [];
      renderMods();
    } catch (err) {
      modsListEl.innerHTML = `<p class="map-hint">Unable to load mods: ${err.message}</p>`;
    }
  }

  function renderMods() {
    if (!modsListEl) return;
    modsListEl.innerHTML = '';
    if (!mods || mods.length === 0) {
      modsListEl.innerHTML = '<p class="map-hint">No mods assigned yet.</p>';
      return;
    }
    mods.forEach(mod => {
      const item = document.createElement('div');
      item.className = 'content-item';
      item.innerHTML = `
        <div>
          <div><strong>${mod.username || mod.email}</strong> <span class="chip">${mod.role}</span></div>
          <div class="map-hint">${mod.email || ''}</div>
        </div>
        <div class="content-item-actions">
          <button type="button" class="remove-content" data-mod="${mod.id}">Remove</button>
        </div>
      `;
      modsListEl.appendChild(item);
    });

    modsListEl.querySelectorAll('.remove-content').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const modId = e.target.dataset.mod;
        if (!modId || !currentGameId) return;
        try {
          await apiJson(`${API_BASE}/games/admin/games/${currentGameId}/mods/${modId}`, { method: 'DELETE' });
          mods = mods.filter(m => m.id !== modId);
          renderMods();
        } catch (err) {
          showNotification(`Failed to remove mod: ${err.message}`, 'error');
        }
      });
    });
  }

  addModBtn?.addEventListener('click', async () => {
    const value = modLookupInput?.value?.trim();
    if (!value || !currentGameId) {
      showNotification('Enter an email or username and select a game first', 'error');
      return;
    }
    try {
      const payload = { email: value, username: value };
      const data = await apiJson(`${API_BASE}/games/admin/games/${currentGameId}/mods`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const newMod = data.mod;
      const exists = mods.some(m => m.id === newMod.id);
      mods = exists ? mods.map(m => (m.id === newMod.id ? newMod : m)) : [...mods, newMod];
      renderMods();
      modLookupInput.value = '';
      showNotification('Mod assigned');
    } catch (err) {
      showNotification(`Failed to assign mod: ${err.message}`, 'error');
    }
  });
  
  // Image preview
  [gameCoverInput, gameCoverGifInput, gameHeroInput, gameGameplayGifInput, gameHoverInput, gameHoverGifInput].forEach(input => {
    input.addEventListener('input', () => {
      const previewId = input.id.replace('game-', '') + '-preview';
      updateImagePreview(previewId.replace('-preview', ''), input.value);
    });
  });
  
  function updateImagePreview(type, url) {
    const preview = $(`#${type}-preview`);
    if (!preview) return;
    
    if (url) {
      preview.innerHTML = `<img src="${url}" alt="${type} preview" />`;
      preview.classList.add('show');
    } else {
      preview.innerHTML = '';
      preview.classList.remove('show');
    }
  }
  
  gameScreenshotsInput.addEventListener('input', updateScreenshotsPreviews);
  
  function updateScreenshotsPreviews() {
    const screenshotsPreview = $('#screenshots-preview');
    const urls = gameScreenshotsInput.value.split('\n').map(s => s.trim()).filter(Boolean);
    
    screenshotsPreview.innerHTML = '';
    urls.forEach((url, index) => {
      const item = document.createElement('div');
      item.className = 'screenshot-item';
      item.innerHTML = `
        <img src="${url}" alt="Screenshot ${index + 1}" />
        <button type="button" class="remove-btn" data-index="${index}">&times;</button>
      `;
      screenshotsPreview.appendChild(item);
    });
    
    screenshotsPreview.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        const urls = gameScreenshotsInput.value.split('\n').map(s => s.trim()).filter(Boolean);
        urls.splice(index, 1);
        gameScreenshotsInput.value = urls.join('\n');
        updateScreenshotsPreviews();
      });
    });
  }
  
  // Upload functionality
  $$('.upload-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      uploadTarget = btn.dataset.target;
      openUploadModal();
    });
  });
  
  function openUploadModal() {
    uploadModal.setAttribute('aria-hidden', 'false');
    uploadFile.value = '';
    uploadPreview.innerHTML = '';
  }
  
  function closeUploadModal() {
    uploadModal.setAttribute('aria-hidden', 'true');
  }
  
  $$('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeUploadModal);
  });
  
  uploadFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
      };
      reader.readAsDataURL(file);
    }
  });
  
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const file = uploadFile.files[0];
    if (!file) {
      showNotification('Please select a file', 'error');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const data = await apiFormData(`${API_BASE}/games/admin/upload`, formData);
      const url = data.url;
      
      if (uploadTarget) {
        $(`#${uploadTarget}`).value = url;
        updateImagePreview(uploadTarget.replace('game-', ''), url);
      }
      
      showNotification('Image uploaded successfully');
      closeUploadModal();
    } catch (err) {
      showNotification(`Upload failed: ${err.message}`, 'error');
    }
  });
  
  // Bulk upload
  bulkUploadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    
    input.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      
      try {
        const data = await apiFormData(`${API_BASE}/games/admin/upload/bulk`, formData);
        const urls = data.images.map(img => img.url);
        
        const currentUrls = gameScreenshotsInput.value.split('\n').map(s => s.trim()).filter(Boolean);
        const allUrls = [...currentUrls, ...urls];
        gameScreenshotsInput.value = allUrls.join('\n');
        updateScreenshotsPreviews();
        
        showNotification(`${urls.length} images uploaded successfully`);
      } catch (err) {
        showNotification(`Bulk upload failed: ${err.message}`, 'error');
      }
    });
    
    input.click();
  });
  
  // Initial load
  loadGames();
});
