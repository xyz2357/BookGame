import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getNode, getBook } from '../core/DataLoader';
import GameLayout, { SceneIllustration } from './GameLayout';
import StoryText from './StoryText';
import AssetImage from './AssetImage';
import { playSfx } from '../core/AudioManager';

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

  if (lastOutcome) {
    const isFailure = lastMatchType === 'default';
    const isHarshFailure = isFailure && !!currentEvent.harsh;
    const panelClass = isFailure
      ? (isHarshFailure ? 'result-panel--failure' : 'result-panel--miss')
      : 'result-panel--success';

    return (
      <GameLayout
        illustration={<SceneIllustration image={sceneImage} name={node?.name} />}
        title={node?.name || ''}
        narrative={
          <div className={`result-panel ${panelClass}`}>
            {isHarshFailure && <p className="hp-loss">蜡烛熄灭了一根…</p>}
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
                      <div className="book-acquired__label">获得书籍</div>
                      <div className="book-acquired__title">《{book.title}》</div>
                    </div>
                  </div>
                );
              })}
          </div>
        }
        actions={
          <button
            className="btn-action"
            onClick={() => { playSfx('page_turn'); isFailure ? clearOutcome() : confirmOutcome(); }}
          >
            {isFailure ? '换一本书试试' : '继续'}
          </button>
        }
      />
    );
  }

  return (
    <GameLayout
      illustration={<SceneIllustration image={sceneImage} name={node?.name} />}
      title={currentEvent.prompt || currentEvent.description}
      narrative={<StoryText text={currentEvent.description} className="description" />}
      actions={
        <button className="btn-action" onClick={openInventory}>
          翻开背包
        </button>
      }
    />
  );
}
