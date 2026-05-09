import { useState } from 'react';
import { getDebugFlags, setDebugFlag, resetDebugFlags, type DebugFlags } from '../core/DebugFlags';

export function DebugButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="game-header__btn debug-btn" onClick={onClick} title="Debug">
      D
    </button>
  );
}

export default function DebugPanel({ onClose }: { onClose: () => void }) {
  const [flags, setFlags] = useState<DebugFlags>(getDebugFlags);

  const handleToggle = (key: string) => {
    const next = !flags[key];
    setDebugFlag(key, next);
    setFlags({ ...getDebugFlags() });
  };

  const handleReset = () => {
    resetDebugFlags();
    setFlags({ ...getDebugFlags() });
  };

  const keys = Object.keys(flags);

  return (
    <div className="debug-overlay" onClick={onClose}>
      <div className="debug-panel" onClick={e => e.stopPropagation()}>
        <div className="debug-panel__header">
          <span>Debug</span>
          <button className="debug-panel__close" onClick={onClose}>×</button>
        </div>
        <div className="debug-panel__body">
          {keys.length === 0 && <p className="debug-panel__empty">No flags</p>}
          {keys.map(key => (
            <label key={key} className="debug-toggle">
              <input type="checkbox" checked={!!flags[key]} onChange={() => handleToggle(key)} />
              <span>{key}</span>
            </label>
          ))}
        </div>
        <div className="debug-panel__footer">
          <button className="debug-panel__reset" onClick={handleReset}>重置</button>
        </div>
      </div>
    </div>
  );
}
