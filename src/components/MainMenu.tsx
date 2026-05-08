import { useState } from 'react';
import { useGame } from '../context/GameContext';
import ConfirmDialog from './ConfirmDialog';

export default function MainMenu() {
  const { startGame, continueGame, hasSavedGame } = useGame();
  const saved = hasSavedGame();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  return (
    <div className="main-menu">
      <div className="main-menu__icon">📖</div>
      <h1 className="main-menu__title">底层书库</h1>
      <p className="main-menu__subtitle">在书页之间，寻找被遗忘的真相</p>
      <div className="main-menu__ornament">✦</div>
      <div className="main-menu__buttons">
        {saved && (
          <button className="btn-primary" onClick={continueGame}>继续游戏</button>
        )}
        <button
          className={saved ? 'btn-secondary' : 'btn-primary'}
          onClick={saved ? () => setShowRestartConfirm(true) : startGame}
        >
          {saved ? '重新开始' : '开始游戏'}
        </button>
      </div>
      <p className="main-menu__hint">一座图书馆的最底层，藏着不该被读到的书。</p>
      {showRestartConfirm && (
        <ConfirmDialog
          title="重新开始"
          message="当前存档将被覆盖，确定重新开始？"
          confirmLabel="重新开始"
          cancelLabel="取消"
          onConfirm={() => { setShowRestartConfirm(false); startGame(); }}
          onCancel={() => setShowRestartConfirm(false)}
        />
      )}
    </div>
  );
}
