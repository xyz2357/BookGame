import { useGame } from '../context/GameContext';

export default function MainMenu() {
  const { startGame, continueGame, hasSavedGame } = useGame();
  const saved = hasSavedGame();

  return (
    <div className="main-menu">
      <h1 className="main-menu__title">底层书库</h1>
      <p className="main-menu__subtitle">在书页之间，寻找被遗忘的真相</p>
      <div className="main-menu__buttons">
        {saved && (
          <button className="btn-primary" onClick={continueGame}>继续游戏</button>
        )}
        <button className={saved ? 'btn-secondary' : 'btn-primary'} onClick={startGame}>
          {saved ? '重新开始' : '开始游戏'}
        </button>
      </div>
    </div>
  );
}
