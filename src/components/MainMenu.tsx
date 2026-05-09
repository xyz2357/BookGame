import { useState } from 'react';
import { useGame } from '../context/GameContext';
import ConfirmDialog from './ConfirmDialog';
import { t } from '../core/I18n';

export default function MainMenu() {
  const { startGame, continueGame, hasSavedGame } = useGame();
  const saved = hasSavedGame();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  return (
    <div className="main-menu">
      <div className="main-menu__icon">📖</div>
      <h1 className="main-menu__title">{t('main_menu.title')}</h1>
      <p className="main-menu__subtitle">{t('main_menu.subtitle')}</p>
      <div className="main-menu__ornament">✦</div>
      <div className="main-menu__buttons">
        {saved && (
          <button className="btn-primary" onClick={continueGame}>{t('main_menu.continue')}</button>
        )}
        <button
          className={saved ? 'btn-secondary' : 'btn-primary'}
          onClick={saved ? () => setShowRestartConfirm(true) : startGame}
        >
          {saved ? t('main_menu.restart') : t('main_menu.start')}
        </button>
      </div>
      <p className="main-menu__hint">{t('main_menu.hint')}</p>
      <p className="main-menu__version">{__BUILD_TIME__}</p>
      {showRestartConfirm && (
        <ConfirmDialog
          title={t('main_menu.restart_confirm_title')}
          message={t('main_menu.restart_confirm_message')}
          confirmLabel={t('main_menu.restart')}
          cancelLabel={t('main_menu.cancel')}
          onConfirm={() => { setShowRestartConfirm(false); startGame(); }}
          onCancel={() => setShowRestartConfirm(false)}
        />
      )}
    </div>
  );
}
