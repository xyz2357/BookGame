import { GameProvider, useGame } from '../context/GameContext';
import MainMenu from './MainMenu';
import NodeView from './NodeView';
import EventView from './EventView';
import InventoryView from './InventoryView';
import EndingView from './EndingView';

function GameHeader() {
  const { state, openInventory } = useGame();
  const { gameState, screen } = state;

  return (
    <header className="game-header">
      <div className="hp-candles">
        {Array.from({ length: gameState.maxHp }, (_, i) => (
          <span key={i} className={`candle ${i < gameState.hp ? 'lit' : 'spent'}`} />
        ))}
      </div>
      {screen !== 'inventory_view' && (
        <button className="game-header__btn" onClick={openInventory}>
          背包 ({gameState.inventory.length})
        </button>
      )}
    </header>
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
