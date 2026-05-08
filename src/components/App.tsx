import { useState } from 'react';
import { GameProvider, useGame } from '../context/GameContext';
import MainMenu from './MainMenu';
import NodeView from './NodeView';
import EventView from './EventView';
import InventoryView from './InventoryView';
import EndingView from './EndingView';
import ConfirmDialog from './ConfirmDialog';

function GameHeader() {
  const { state, openInventory, returnToMenu } = useGame();
  const { gameState, screen } = state;
  const [showMenuConfirm, setShowMenuConfirm] = useState(false);

  return (
    <>
      <header className="game-header">
        <div className="hp-candles">
          {Array.from({ length: gameState.maxHp }, (_, i) => (
            <span key={i} className={`candle ${i < gameState.hp ? 'lit' : 'spent'}`} />
          ))}
        </div>
        <div className="game-header__actions">
          {screen !== 'inventory_view' && (
            <button className="game-header__btn" onClick={openInventory}>
              背包 ({gameState.inventory.length})
            </button>
          )}
          <button className="game-header__btn" onClick={() => setShowMenuConfirm(true)}>
            菜单
          </button>
        </div>
      </header>
      {showMenuConfirm && (
        <ConfirmDialog
          title="返回主菜单"
          message="确定返回主菜单？当前进度已自动保存。"
          confirmLabel="返回"
          cancelLabel="继续游戏"
          onConfirm={() => { setShowMenuConfirm(false); returnToMenu(); }}
          onCancel={() => setShowMenuConfirm(false)}
        />
      )}
    </>
  );
}

function ScreenRouter() {
  const { state } = useGame();
  const isGameScreen = state.screen !== 'main_menu' && state.screen !== 'ending_view';

  let screen;
  switch (state.screen) {
    case 'main_menu':
      screen = <MainMenu />;
      break;
    case 'node_view':
      screen = <NodeView />;
      break;
    case 'event_view':
      screen = <EventView />;
      break;
    case 'inventory_view':
      screen = <InventoryView />;
      break;
    case 'ending_view':
      screen = <EndingView />;
      break;
  }

  return (
    <>
      {isGameScreen && <GameHeader />}
      <div className="screen-content" key={state.screen}>
        {screen}
      </div>
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <div className="container">
        <ScreenRouter />
      </div>
    </GameProvider>
  );
}
