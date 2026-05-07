import { GameProvider, useGame } from '../context/GameContext';
import MainMenu from './MainMenu';
import NodeView from './NodeView';
import EventView from './EventView';
import InventoryView from './InventoryView';
import EndingView from './EndingView';

function ScreenRouter() {
  const { state } = useGame();

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
    <div className="screen-content" key={state.screen}>
      {screen}
    </div>
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
