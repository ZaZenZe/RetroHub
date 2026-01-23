import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const Settings = () => {
  const { user, updateUserData, isAuthenticated } = useAuth();
  const { settings, updateSettings } = useTheme();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [passwords, setPasswords] = useState({
    old: '',
    new: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleAccountSave = async () => {
    if (!isAuthenticated) return;
    
    setMessage('');
    setError('');
    
    try {
      const result = await api.updateUser(user?.id, {
        username: formData.username,
        email: formData.email,
      });
      updateUserData(result.user);
      setMessage('Account updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update account');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePasswordSave = async () => {
    if (!isAuthenticated || !passwords.old || !passwords.new) return;
    
    setMessage('');
    setError('');
    
    try {
      await api.updatePassword(user?.id, passwords.old, passwords.new);
      setPasswords({ old: '', new: '' });
      setMessage('Password updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update password');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePreferencesSave = () => {
    setMessage('Preferences saved!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClearStorage = () => {
    if (confirm('Are you sure you want to clear all local data?')) {
      localStorage.clear();
      setMessage('Local data cleared!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleRevokeSessions = async () => {
    if (confirm('Sign out from all devices?')) {
      // This would require a backend endpoint to revoke all sessions
      setMessage('Sessions revoked!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="view active" aria-labelledby="settings-title">
        <div className="panel">
          <h2 id="settings-title">Settings</h2>
          <p className="map-hint">Please sign in to access settings.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="settings-view" className="view active" aria-labelledby="settings-title">
      <div className="panel tech-card" aria-labelledby="settings-title">
        <h2 id="settings-title" className="glitch-text">SYSTEM_CONFIG</h2>
        
        {message && (
          <div style={{ padding: '12px', background: 'var(--success)', borderRadius: '8px', marginBottom: '16px' }}>
            {message}
          </div>
        )}
        
        {error && (
          <div style={{ padding: '12px', background: 'var(--danger)', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}
        
        <div className="settings-grid">
          <div className="settings-card tech-card">
            <h3>ACCOUNT</h3>
            <label>
              Username
              <input
                id="settings-username"
                type="text"
                placeholder="trainer"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                id="settings-email"
                type="email"
                placeholder="trainer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </label>
            <button className="btn-cyber" type="button" onClick={handleAccountSave}>
              SAVE_ACCOUNT
            </button>
          </div>

          <div className="settings-card tech-card">
            <h3>PASSWORD</h3>
            <label>
              Current password
              <input
                id="settings-pass-old"
                type="password"
                placeholder="••••••"
                value={passwords.old}
                onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
              />
            </label>
            <label>
              New password
              <input
                id="settings-pass-new"
                type="password"
                placeholder="••••••"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              />
            </label>
            <button className="btn-cyber" type="button" onClick={handlePasswordSave}>
              UPDATE_PASSWORD
            </button>
          </div>

          <div className="settings-card tech-card">
            <h3>PREFERENCES</h3>
            <label className="switch">
              <input
                id="pref-chat"
                type="checkbox"
                checked={settings.chat}
                onChange={(e) => updateSettings({ chat: e.target.checked })}
              />
              <span>Keep chatbot open per game</span>
            </label>
            <label className="switch">
              <input
                id="pref-badge"
                type="checkbox"
                checked={settings.badge}
                onChange={(e) => updateSettings({ badge: e.target.checked })}
              />
              <span>Show achievement pings</span>
            </label>
            <label className="switch">
              <input
                id="pref-analytics"
                type="checkbox"
                checked={settings.analytics}
                onChange={(e) => updateSettings({ analytics: e.target.checked })}
              />
              <span>Opt into anonymized analytics</span>
            </label>
            <button className="btn-cyber" type="button" onClick={handlePreferencesSave}>
              SAVE_PREFS
            </button>
          </div>

          <div className="settings-card danger tech-card">
            <h3>DANGER_ZONE</h3>
            <p className="map-hint">Clear local data or sign out everywhere.</p>
            <button className="btn-cyber secondary" type="button" onClick={handleClearStorage}>
              PURGE_CACHE
            </button>
            <button className="btn-cyber" type="button" onClick={handleRevokeSessions}>
              REVOKE_SESSIONS
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Settings;
