import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useGames } from '../../context/GamesContext';

const GameForm = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user, updateUserData } = useAuth();
  const { createGame, updateGame } = useGames();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    platform: '',
    releaseYear: '',
    versionLabel: '',
    description: '',
    coverImageUrl: '',
    coverGifUrl: '',
    heroImageUrl: '',
    gameplayGifUrl: '',
    hoverImageUrl: '',
    hoverGifUrl: '',
    screenshots: '',
    retroAchievementsGameId: '',
    theme: {
      name: 'retro',
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
  });
  const [tips, setTips] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [mods, setMods] = useState([]);
  const [modQuery, setModQuery] = useState('');
  const [modsLoading, setModsLoading] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadGame();
    }
  }, [gameId]);

  const loadGame = async () => {
    setLoading(true);
    try {
      const data = await api.request(`/admin/games/${gameId}`);
      const game = data.game;

      setFormData({
        title: game.title || '',
        slug: game.slug || '',
        platform: game.platform || '',
        releaseYear: game.releaseYear || '',
        versionLabel: game.versionLabel || '',
        description: game.description || '',
        coverImageUrl: game.coverImageUrl || '',
        coverGifUrl: game.coverGifUrl || '',
        heroImageUrl: game.heroImageUrl || '',
        gameplayGifUrl: game.gameplayGifUrl || '',
        hoverImageUrl: game.hoverImageUrl || '',
        hoverGifUrl: game.hoverGifUrl || '',
        screenshots: (game.screenshots || []).join('\n'),
        retroAchievementsGameId: game.retroAchievementsGameId || '',
        theme: game.theme || formData.theme,
      });

      setTips(
        (data.tips || []).map((t) =>
          typeof t === 'string'
            ? { content: t, category: 'gameplay' }
            : {
                id: t.id || t._id,
                content: t.content || '',
                category: t.category || 'gameplay',
              }
        )
      );
      setFaqs(
        (data.faqs || []).map((f) => ({
          id: f.id || f._id,
          question: f.question || '',
          answer: f.answer || '',
        }))
      );

      if (isAdmin) {
        await loadMods(game._id || game.id);
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      alert('Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await api.uploadFile(file);
      if (res.url) {
        const absoluteUrl = res.url.startsWith('http')
          ? res.url
          : `${window.location.origin}${res.url}`;
        setFormData(prev => ({ ...prev, [field]: absoluteUrl }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setLoading(true);
      const uploadedUrls = [];
      
      for (const file of files) {
        const res = await api.uploadFile(file);
        if (res.url) {
          const absoluteUrl = res.url.startsWith('http')
            ? res.url
            : `${window.location.origin}${res.url}`;
          uploadedUrls.push(absoluteUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          screenshots: prev.screenshots
            ? prev.screenshots + '\n' + uploadedUrls.join('\n')
            : uploadedUrls.join('\n'),
        }));
      }
    } catch (error) {
      console.error('Screenshot upload failed:', error);
      alert('Screenshot upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedTips = tips
        .map((t) =>
          typeof t === 'string'
            ? { content: t, category: 'gameplay' }
            : { content: t.content, category: t.category || 'gameplay' }
        )
        .filter((t) => t.content);
      const normalizedFaqs = faqs
        .map((f) => ({ question: f.question, answer: f.answer }))
        .filter((f) => f.question && f.answer);

      const payload = {
        ...formData,
        retroAchievementsGameId: formData.retroAchievementsGameId
          ? Number(formData.retroAchievementsGameId)
          : null,
        screenshots: formData.screenshots
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        tips: normalizedTips,
        faqs: normalizedFaqs,
      };

      if (gameId) {
        await updateGame(gameId, payload);
        alert('Game updated successfully!');
      } else {
        await createGame(payload);
        alert('Game created successfully!');
      }

      navigate('/admin/games');
    } catch (error) {
      console.error('Failed to save game:', error);
      alert(`Failed to save game: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('theme.')) {
      const key = name.replace('theme.', '');
      if (key.startsWith('colors.')) {
        const colorKey = key.replace('colors.', '');
        setFormData({
          ...formData,
          theme: {
            ...formData.theme,
            colors: {
              ...formData.theme.colors,
              [colorKey]: value,
            },
          },
        });
      } else {
        setFormData({
          ...formData,
          theme: {
            ...formData.theme,
            [key]: value,
          },
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTitleChange = (value) => {
    setFormData({
      ...formData,
      title: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    });
  };

  const addTip = () => {
    setTips([...tips, { content: '', category: 'gameplay' }]);
  };

  const updateTip = (index, field, value) => {
    const newTips = [...tips];
    newTips[index] = { ...newTips[index], [field]: value };
    setTips(newTips);
  };

  const removeTip = (index) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const updateFaq = (index, field, value) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFaqs(newFaqs);
  };

  const removeFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const loadMods = async (gameParam) => {
    if (!gameParam) return;
    setModsLoading(true);
    try {
      const data = await api.getGameMods(gameParam);
      setMods(data.mods || []);
    } catch (error) {
      console.error('Failed to load moderators:', error);
      setMods([]);
    } finally {
      setModsLoading(false);
    }
  };

  const handleAddMod = async () => {
    if (!gameId || !modQuery.trim()) return;
    try {
      const data = await api.addGameMod(gameId, modQuery.trim());
      setModQuery('');
      await loadMods(gameId);

      // If the admin added the currently-logged-in user as a moderator, refresh their local user data
      const added = data && (data.mod || data.user || data);
      const modObj = data.mod || data.user || data;
      if (modObj && user && (modObj.id === user.id || modObj.id === user._id)) {
        updateUserData({ moderatedGames: modObj.moderatedGames || [], role: modObj.role || user.role });
      }
    } catch (error) {
      console.error('Failed to add moderator:', error);
      alert(`Failed to add moderator: ${error.message}`);
    }
  };

  const handleRemoveMod = async (userId) => {
    if (!gameId || !userId) return;
    try {
      const data = await api.removeGameMod(gameId, userId);
      await loadMods(gameId);

      const modObj = data && (data.mod || data.user || data);
      if (modObj && user && (modObj.id === user.id || modObj.id === user._id)) {
        updateUserData({ moderatedGames: modObj.moderatedGames || [], role: modObj.role || user.role });
      }
    } catch (error) {
      console.error('Failed to remove moderator:', error);
      alert(`Failed to remove moderator: ${error.message}`);
    }
  };

  if (loading && gameId) {
    return <div className="loading">Loading game...</div>;
  }

  return (
    <section id="create-view" className="admin-view active">
      <div className="view-header">
        <h2>{gameId ? 'Edit Game' : 'Create New Game'}</h2>
        <button className="cta secondary" onClick={() => navigate('/admin/games')}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="game-form">
        <div className="form-grid">
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="slug">Slug *</label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
              />
              <small>URL-friendly identifier (auto-generated from title)</small>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="platform">Platform *</label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select platform</option>
                  <option value="NES">NES</option>
                  <option value="SNES">SNES</option>
                  <option value="GB">GB</option>
                  <option value="GBC">GBC</option>
                  <option value="N64">N64</option>
                  <option value="GBA">GBA</option>
                  <option value="GC">GameCube</option>
                  <option value="DS">DS</option>
                  <option value="Wii">Wii</option>
                  <option value="3DS">3DS</option>
                  <option value="Switch">Switch</option>
                  <option value="PS1">PS1</option>
                  <option value="PS2">PS2</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="releaseYear">Release Year *</label>
                <input
                  type="number"
                  id="releaseYear"
                  name="releaseYear"
                  value={formData.releaseYear}
                  onChange={handleChange}
                  min="1980"
                  max={new Date().getFullYear()}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="versionLabel">Version Label</label>
              <input
                type="text"
                id="versionLabel"
                name="versionLabel"
                value={formData.versionLabel}
                onChange={handleChange}
                placeholder="e.g., Fire Red, Emerald, etc."
              />
            </div>
            <div className="form-group">
              <label htmlFor="retroAchievementsGameId">RetroAchievements Game ID</label>
              <input
                type="number"
                id="retroAchievementsGameId"
                name="retroAchievementsGameId"
                min="1"
                value={formData.retroAchievementsGameId}
                onChange={handleChange}
              />
              <small>Use the numeric game ID from retroachievements.org</small>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Media</h3>
            {[
              { label: 'Cover Image', name: 'coverImageUrl' },
              { label: 'Hero Image (Background)', name: 'heroImageUrl' },
              { label: 'Gameplay GIF', name: 'gameplayGifUrl' },
              { label: 'Hover GIF', name: 'hoverGifUrl' }
            ].map(field => (
              <div className="form-group" key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    placeholder="Paste URL or upload a file below"
                    style={{ flex: 1 }}
                  />
                  <label className="cta secondary" style={{ cursor: 'pointer', margin: 0 }}>
                    Upload
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, field.name)} 
                    />
                  </label>
                </div>
                {formData[field.name] && (
                  <img src={formData[field.name]} alt="Preview" style={{ height: '40px', marginTop: '5px' }} />
                )}
              </div>
            ))}
            
            <div className="form-group">
              <label htmlFor="screenshots">Screenshots (one per line)</label>
              <div style={{ marginBottom: '10px' }}>
                <label className="cta secondary" style={{ cursor: 'pointer' }}>
                  Upload Multiple
                  <input 
                    type="file" 
                    hidden 
                    multiple
                    accept="image/*"
                    onChange={(e) => handleScreenshotUpload(e)} 
                  />
                </label>
              </div>
              <textarea
                id="screenshots"
                name="screenshots"
                value={formData.screenshots}
                onChange={handleChange}
                rows="4"
                placeholder="https://example.com/s1.png"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Theme Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Theme Name</label>
                <input 
                  type="text" 
                  name="theme.name" 
                  value={formData.theme.name} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
              {Object.entries(formData.theme.colors).map(([key, val]) => (
                <div className="form-group" key={key}>
                  <label style={{ fontSize: '11px' }}>{key}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input 
                      type="color" 
                      value={val} 
                      onChange={(e) => handleChange({ target: { name: `theme.colors.${key}`, value: e.target.value } })}
                      style={{ padding: 0, width: '30px', height: '30px', border: 'none' }}
                    />
                    <input 
                      type="text" 
                      value={val} 
                      onChange={(e) => handleChange({ target: { name: `theme.colors.${key}`, value: e.target.value } })}
                      style={{ fontSize: '11px', padding: '4px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="form-section">
              <h3>Moderators</h3>
              <div className="form-group">
                <label htmlFor="mod-lookup">Add moderator (email or username)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    id="mod-lookup"
                    type="text"
                    placeholder="mod@retrohub.test"
                    value={modQuery}
                    onChange={(e) => setModQuery(e.target.value)}
                    disabled={!gameId || modsLoading}
                  />
                  <button
                    type="button"
                    className="cta secondary"
                    onClick={handleAddMod}
                    disabled={!gameId || !modQuery.trim() || modsLoading}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="content-list">
                {modsLoading && <div className="map-hint">Loading moderators...</div>}
                {!modsLoading && mods.length === 0 && (
                  <div className="map-hint">No moderators assigned to this game yet.</div>
                )}
                {mods.map((mod) => (
                  <div key={mod.id || mod._id} className="content-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'grid', gap: '4px' }}>
                        <strong>{mod.username || 'Moderator'}</strong>
                        <small style={{ color: 'var(--admin-muted)' }}>{mod.email}</small>
                      </div>
                      <button
                        type="button"
                        className="cta danger"
                        onClick={() => handleRemoveMod(mod.id || mod._id)}
                        disabled={modsLoading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>Tips</h3>
            <div id="tips-list">
              {tips.map((tip, index) => (
                <div key={index} className="content-item">
                  <input
                    type="text"
                    value={tip.content || ''}
                    onChange={(e) => updateTip(index, 'content', e.target.value)}
                    placeholder="Enter tip..."
                  />
                  <select
                    value={tip.category || 'gameplay'}
                    onChange={(e) => updateTip(index, 'category', e.target.value)}
                  >
                    <option value="gameplay">Gameplay</option>
                    <option value="story">Story</option>
                    <option value="collectibles">Collectibles</option>
                    <option value="secrets">Secrets</option>
                  </select>
                  <button
                    type="button"
                    className="cta danger"
                    onClick={() => removeTip(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="cta secondary" onClick={addTip}>
              Add Tip
            </button>
          </div>

          <div className="form-section">
            <h3>FAQs</h3>
            <div id="faqs-list">
              {faqs.map((faq, index) => (
                <div key={index} className="content-item">
                  <input
                    type="text"
                    value={faq.question || ''}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    placeholder="Question..."
                  />
                  <textarea
                    value={faq.answer || ''}
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    placeholder="Answer..."
                    rows="2"
                  />
                  <button
                    type="button"
                    className="cta danger"
                    onClick={() => removeFaq(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="cta secondary" onClick={addFaq}>
              Add FAQ
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="cta" disabled={loading}>
            {loading ? 'Saving...' : gameId ? 'Update Game' : 'Create Game'}
          </button>
          <button
            type="button"
            className="cta secondary"
            onClick={() => navigate('/admin/games')}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
};

export default GameForm;
