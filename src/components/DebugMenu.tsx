import { useState, useEffect, useCallback } from 'react';
import { getDebugFlags, setDebugFlag, resetDebugFlags, type DebugFlags } from '../core/DebugFlags';

export default function DebugMenu() {
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState<DebugFlags>(getDebugFlags);

  const toggle = useCallback((e: KeyboardEvent) => {
    if (e.key === '`' && e.ctrlKey) {
      e.preventDefault();
      setOpen(v => !v);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', toggle);
    return () => window.removeEventListener('keydown', toggle);
  }, [toggle]);

  const handleToggle = <K extends keyof DebugFlags>(key: K) => {
    const next = !flags[key];
    setDebugFlag(key, next as DebugFlags[K]);
    setFlags(getDebugFlags());
  };

  const handleReset = () => {
    resetDebugFlags();
    setFlags(getDebugFlags());
  };

  if (!open) return null;

  return (
    <div className="debug-overlay" onClick={() => setOpen(false)}>
      <div className="debug-panel" onClick={e => e.stopPropagation()}>
        <div className="debug-panel__header">
          <span>Debug</span>
          <button className="debug-panel__close" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="debug-panel__body">
          <label className="debug-toggle">
            <input type="checkbox" checked={flags.portraitOverlay} onChange={() => handleToggle('portraitOverlay')} />
            <span>立绘叠加在背景图上</span>
          </label>
        </div>
        <div className="debug-panel__footer">
          <button className="debug-panel__reset" onClick={handleReset}>重置</button>
          <span className="debug-panel__hint">Ctrl+` 开关</span>
        </div>
      </div>
    </div>
  );
}
