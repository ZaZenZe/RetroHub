import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setFormData({ email: '', password: '', username: '' });
      setActiveTab('login');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      id="auth-modal"
      className="map-modal"
      aria-hidden={!isOpen}
      role="dialog"
      aria-label="Sign in"
    >
      <div className="map-modal-backdrop" onClick={onClose} />
      <div className="map-modal-content" role="document">
        <button
          className="map-modal-close material-symbols-outlined"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          close
        </button>
        <h3 className="glitch-text" style={{ marginBottom: '6px' }}>ACCESS GRANTED</h3>
        <p className="map-hint" style={{ marginBottom: '8px' }}>
          Demo only — use one of the sample accounts below.
        </p>
        <div className="auth-tabs" role="tablist" aria-label="Auth tabs">
          <button
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'login'}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'register'}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ color: 'var(--danger)', padding: '8px 0' }}>
            {error}
          </div>
        )}

        {activeTab === 'login' ? (
          <form
            id="auth-form-login"
            className="post-form"
            onSubmit={handleSubmit}
            role="tabpanel"
            aria-hidden={false}
          >
            <input
              name="email"
              type="email"
              placeholder="Email (e.g., oak@lab)"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password (e.g., pikachu)"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" className="btn-cyber" disabled={loading}>
              {loading ? 'SIGNING_IN...' : 'SIGN_IN'}
            </button>
          </form>
        ) : (
          <form
            id="auth-form-register"
            className="post-form"
            onSubmit={handleSubmit}
            role="tabpanel"
            aria-hidden={false}
          >
            <input
              name="username"
              type="text"
              placeholder="Username (e.g., oak)"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email (e.g., admin@retrohub.test)"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" className="btn-cyber" disabled={loading}>
              {loading ? 'CREATING...' : 'CREATE_ACCOUNT'}
            </button>
          </form>
        )}

        <div className="map-hint">
          <div>Demo users:</div>
          <div>• admin@retrohub.test / Admin@123 (admin)</div>
          <div>• mod@retrohub.test / Mod@123 (moderator)</div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
