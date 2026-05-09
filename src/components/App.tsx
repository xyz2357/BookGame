import { useState, useEffect, useRef } from 'react';
import { GameProvider, useGame } from '../context/GameContext';
import MainMenu from './MainMenu';
import NodeView from './NodeView';
import EventView from './EventView';
import InventoryView from './InventoryView';
import EndingView from './EndingView';
import ConfirmDialog from './ConfirmDialog';
import { playSfx, playBgm, stopBgm, setMuted, isMuted, initAudioPreference } from '../core/AudioManager';
import { t } from '../core/I18n';

function GameHeader() {
  const { state, openInventory, returnToMenu } = useGame();
  const { gameState, screen } = state;
  const [showMenuConfirm, setShowMenuConfirm] = useState(false);
  const [audioMuted, setAudioMuted] = useState(isMuted);

  const toggleMute = () => {
    const next = !audioMuted;
    setAudioMuted(next);
    setMuted(next);
  };

  return (
    <>
      <header className="game-header">
        <div className="hp-candles" title={t('header.hp_tooltip', { hp: gameState.hp, maxHp: gameState.maxHp })}>
          {Array.from({ length: gameState.maxHp }, (_, i) => (
            <span key={i} className={`candle ${i < gameState.hp ? 'lit' : 'spent'}`} />
          ))}
        </div>
        <div className="game-header__actions">
          <button className="game-header__btn" onClick={toggleMute} title={audioMuted ? t('header.sound_off') : t('header.sound_on')}>
            {audioMuted ? '🔇' : '🔊'}
          </button>
          {screen !== 'inventory_view' && (
            <button className="game-header__btn" onClick={openInventory}>
              {t('header.inventory')} ({gameState.inventory.length})
            </button>
          )}
          <button className="game-header__btn" onClick={() => setShowMenuConfirm(true)}>
            {t('header.menu')}
          </button>
        </div>
      </header>
      {showMenuConfirm && (
        <ConfirmDialog
          title={t('header.menu_confirm_title')}
          message={t('header.menu_confirm_message')}
          confirmLabel={t('header.menu_confirm_ok')}
          cancelLabel={t('header.menu_confirm_cancel')}
          onConfirm={() => { setShowMenuConfirm(false); returnToMenu(); }}
          onCancel={() => setShowMenuConfirm(false)}
        />
      )}
    </>
  );
}

function ScreenRouter() {
  const { state } = useGame();
  const prevScreenRef = useRef(state.screen);
  const isGameScreen = state.screen !== 'main_menu' && state.screen !== 'ending_view';

  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = state.screen;

    switch (state.screen) {
      case 'main_menu':
        playBgm('menu');
        break;
      case 'node_view':
        if (prev === 'main_menu') {
          playBgm('explore');
        } else if (prev !== 'inventory_view' && prev !== 'event_view') {
          playBgm('explore');
        }
        break;
      case 'ending_view':
        playBgm('ending');
        break;
    }
  }, [state.screen]);

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
  useEffect(() => {
    initAudioPreference();
  }, []);

  return (
    <GameProvider>
      <div className="container">
        <ScreenRouter />
      </div>
    </GameProvider>
  );
}
