import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { Capacitor } from '@capacitor/core';
import App from './App';

// Ensure native builds resolve API base immediately (helps early startup requests)
try {
  if (Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    const nativeBase = import.meta.env.VITE_API_BASE_NATIVE || import.meta.env.VITE_API_BASE_ANDROID || 'http://10.0.2.2:5173/api';
    // expose and log
    // eslint-disable-next-line no-console
    console.log('[startup] running on native platform, forcing API base ->', nativeBase);
    try { window.__RETROHUB_API_BASE = nativeBase; } catch (e) {}
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[startup] Capacitor detection failed', e && e.message);
}

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
