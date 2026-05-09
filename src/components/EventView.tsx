import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getNode, getBook } from '../core/DataLoader';
import GameLayout, { SceneIllustration } from './GameLayout';
import StoryText from './StoryText';
import AssetImage from './AssetImage';
import { playSfx } from '../core/AudioManager';
import { t } from '../core/I18n';
import { getDebugFlags } from '../core/DebugFlags';

export default function EventView() {
  const { state, confirmOutcome, clearOutcome, openInventory } = useGame();
  const { currentEvent, lastOutcome, lastMatchType, gameState } = state;
  const node = getNode(gameState.currentNodeId);

  const prevOutcomeRef = useRef<typeof lastOutcome>(null);
  useEffect(() => {
    if (lastOutcome && lastOutcome !== prevOutcomeRef.current) {
      if (lastMatchType === 'super_match') {
        playSfx('super_match');
      } else if (lastMatchType === 'tag_match') {
        playSfx('success');
      } else if (lastMatchType === 'default') {
        if (currentEvent?.harsh) {
          playSfx('hp_loss');
        } else {
          playSfx('fail');
        }
      }
      if (lastOutcome.effects.some(e => e.type === 'gain_book')) {
        setTimeout(() => playSfx('gain_book'), 600);
      }
    }
    prevOutcomeRef.current = lastOutcome;
  }, [lastOutcome]);

  if (!currentEvent) return null;

  const sceneImage = node?.image;
  const overlayMode = getDebugFlags().portraitOverlay;

  const portraitImg = currentEvent.character ? (
    <AssetImage kind="characters" image={currentEvent.character} alt="" className="character-portrait__img" />
  ) : null;

  const overlayPortrait = portraitImg && overlayMode ? (
    <div className="character-portrait character-portrait--overlay">{portraitImg}</div>
  ) : null;

  const inlinePortrait = portraitImg && !overlayMode ? (
    <div className="character-portrait">{portraitImg}</div>
  ) : null;

  if (lastOutcome) {
    const isFailure = lastMatchType === 'default';
    const isHarshFailure = isFailure && !!currentEvent.harsh;
    const panelClass = isFailure
      ? (isHarshFailure ? 'result-panel--failure' : 'result-panel--miss')
      : 'result-panel--success';

    return (
      <GameLayout
        illustration={<SceneIllustration image={sceneImage} name={node?.name} portraitOverlay={overlayPortrait} />}
        title={node?.name || ''}
        narrative={
          <>
            {inlinePortrait}
            <div className={`result-panel ${panelClass}`}>
              {isHarshFailure && <p className="hp-loss">{t('event.hp_loss')}</p>}
              <StoryText text={lastOutcome.text} className="description" />
              {lastOutcome.effects
                .filter(e => e.type === 'gain_book')
                .map(e => {
                  const book = getBook((e as { type: 'gain_book'; book_id: string }).book_id);
                  if (!book) return null;
                  return (
                    <div key={book.id} className="book-acquired">
                      {book.image && <AssetImage className="book-card__thumb" kind="books" image={book.image} alt={book.title} />}
                      <div>
                        <div className="book-acquired__label">{t('event.book_acquired')}</div>
                        <div className="book-acquired__title">《{book.title}》</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        }
        actions={
          <button
            className="btn-action"
            onClick={() => { playSfx('page_turn'); isFailure ? clearOutcome() : confirmOutcome(); }}
          >
            {isFailure ? t('event.try_another') : t('event.continue')}
          </button>
        }
      />
    );
  }

  return (
    <GameLayout
      illustration={<SceneIllustration image={sceneImage} name={node?.name} portraitOverlay={overlayPortrait} />}
      title={currentEvent.prompt || currentEvent.description}
      narrative={
        <>
          {inlinePortrait}
          <StoryText text={currentEvent.description} className="description" />
        </>
      }
      actions={
        <button className="btn-action" onClick={openInventory}>
          {t('event.open_inventory')}
        </button>
      }
    />
  );
}
