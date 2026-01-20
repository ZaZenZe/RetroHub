import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setFormData({ email: '', password: '', name: '' });
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
        await register(formData.name, formData.email, formData.password);
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
        <h3 style={{ marginBottom: '6px' }}>Welcome back</h3>
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
            <button type="submit" className="cta" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
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
              name="name"
              type="text"
              placeholder="Display name"
              value={formData.name}
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
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
            <button type="submit" className="cta" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        <div className="map-hint">
          <div>Demo users:</div>
          <div>• oak@lab / pikachu (admin)</div>
          <div>• student@epita / rattata (student)</div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
