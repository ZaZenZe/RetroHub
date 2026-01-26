import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Small page-level tracker that shows how long the user stayed on the page.
// It pauses the global session accumulator while active to avoid double-counting
// and sends accumulated seconds to the server on interval / unmount.
export default function PageTracker({ label = 'This page', sendInterval = 30 }) {
  const { user, pauseTracking, resumeTracking, refreshUserStats } = useAuth();
  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0); // seconds since last send
  const intervalRef = useRef(null);
  const visibilityRef = useRef(document.visibilityState === 'visible');

  useEffect(() => {
    if (!user) return undefined;

    // When tracker mounts, pause global tracker to avoid double-count
    pauseTracking();

    const tick = () => {
      if (!running) return;
      if (document.visibilityState !== 'visible') return;
      setElapsed((s) => s + 1);
    };

    intervalRef.current = setInterval(tick, 1000);

    const handleVisibility = () => {
      visibilityRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      // resume global tracker on unmount
      resumeTracking();
    };
  }, [user]);

  // Periodic sender
  useEffect(() => {
    if (!user) return;
    if (!sendInterval || sendInterval <= 0) return;
    const id = setInterval(async () => {
      await flush();
    }, sendInterval * 1000);
    return () => clearInterval(id);
  }, [user, sendInterval, running]);

  const flush = async () => {
    if (!user) return;
    const toSend = elapsed;
    if (!toSend || toSend <= 0) return;
    setElapsed(0);
    try {
      await api.postSessionSeconds(user.id, toSend);
      // refresh canonical stats
      await refreshUserStats();
    } catch (err) {
      console.debug('PageTracker: failed to send seconds', err);
      // re-add unsent seconds to elapsed so they aren't lost
      setElapsed((s) => s + toSend);
    }
  };

  const handlePause = async () => {
    setRunning(false);
    await flush();
  };
  const handleResume = () => {
    setRunning(true);
  };

  const fmt = (s) => {
    if (!s) return '0s';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h${rm ? ` ${rm}m` : ''}`;
  };

  return (
    <div className="page-tracker" role="status" aria-live="polite">
      <div className="tracker-label">{label} tracking</div>
      <div className="tracker-value">{fmt(elapsed)}</div>
      <div className="tracker-actions">
        {running ? (
          <button className="btn-icon" title="Pause tracking" onClick={handlePause} aria-pressed="false">⏸</button>
        ) : (
          <button className="btn-icon" title="Resume tracking" onClick={handleResume} aria-pressed="true">▶</button>
        )}
        <button className="btn-icon" title="Save now" onClick={flush}>💾</button>
      </div>
    </div>
  );
}
