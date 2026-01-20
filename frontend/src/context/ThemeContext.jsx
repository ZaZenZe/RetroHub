import { createContext, useContext, useState, useEffect } from 'react';

const SETTINGS_KEY = 'retrohub:settings';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? JSON.parse(stored) : {
        chat: true,
        badge: true,
        analytics: false,
      };
    } catch {
      return { chat: true, badge: true, analytics: false };
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const applyTheme = (theme) => {
    if (!theme || !theme.colors) {
      clearTheme();
      return;
    }

    const colors = theme.colors;
    const styleId = 'dynamic-theme-style';
    let style = document.getElementById(styleId);
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    const ring = colors.ring || 'rgba(255,155,40,0.45)';
    const shadow = colors.shadow || '0 8px 28px rgba(0,0,0,0.45)';

    style.textContent = `
      :root {
        --primary: ${colors.primary || '#ff7b00'};
        --primary-2: ${colors.primaryAlt || '#ff9f1a'};
        --accent: ${colors.accent || '#4fc3f7'};
        --bg: ${colors.background || '#0d0e12'};
        --card: ${colors.card || '#1b1f29'};
        --text: ${colors.text || '#e6e6e9'};
        --border: ${colors.border || '#232734'};
        --ring: ${ring};
        --shadow: ${shadow};
      }
    `;

    // Apply theme class to body
    document.body.className = `theme-${theme.name || 'default'}`;
    setCurrentTheme(theme);
  };

  const clearTheme = () => {
    const style = document.getElementById('dynamic-theme-style');
    if (style) {
      style.remove();
    }
    document.body.className = 'theme-home';
    setCurrentTheme(null);
  };

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        settings,
        applyTheme,
        clearTheme,
        updateSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
