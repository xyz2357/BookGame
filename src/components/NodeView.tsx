import { useEffect, useRef } from 'react';
import { useGame, canTraverse } from '../context/GameContext';
import { getNode, getEvent, getBook } from '../core/DataLoader';
import { applyEffects } from '../core/EffectApplier';
import { completeEvent } from '../core/GameState';
import GameLayout, { SceneIllustration } from './GameLayout';
import StoryText from './StoryText';
import AssetImage from './AssetImage';
import { playSfx } from '../core/AudioManager';
import { t } from '../core/I18n';

export default function NodeView() {
  const { state, enterEvent, moveToNode, autoEventApplied, clearOutcome } = useGame();
  const { gameState, lastOutcome } = state;
  const node = getNode(gameState.currentNodeId);
  const autoTriggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!node) return;
    for (const eventId of node.events) {
      if (gameState.completedEvents.includes(eventId)) continue;
      if (autoTriggeredRef.current.has(eventId)) continue;
      const event = getEvent(eventId);
      if (event && event.solutions.length === 0) {
        autoTriggeredRef.current.add(eventId);
        const outcome = event.default_outcome;
        let newState = applyEffects(gameState, outcome.effects);
        newState = completeEvent(newState, eventId);
        if (outcome.effects.some(e => e.type === 'gain_book')) playSfx('gain_book');
        autoEventApplied(newState, outcome);
        break;
      }
    }
  }, [gameState.currentNodeId]);

  if (!node) return <div>{t('node.unknown_area')}</div>;

  const manualEvents = node.events
    .map(eid => ({ id: eid, event: getEvent(eid) }))
    .filter(({ event }) => event && event.solutions.length > 0);

  const availableEvents = manualEvents.filter(
    ({ id }) => !gameState.completedEvents.includes(id)
  );

  const completedEvents = manualEvents.filter(
    ({ id }) => gameState.completedEvents.includes(id)
  );

  if (lastOutcome) {
    return (
      <GameLayout
        illustration={<SceneIllustration image={node.image} name={node.name} />}
        title={node.name}
        narrative={
          <div className="result-panel result-panel--success">
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
                      <div className="book-acquired__label">{t('node.book_acquired')}</div>
                      <div className="book-acquired__title">《{book.title}》</div>
                    </div>
                  </div>
                );
              })}
          </div>
        }
        actions={
          <button className="btn-action" onClick={clearOutcome}>{t('node.continue')}</button>
        }
      />
    );
  }

  return (
    <GameLayout
      illustration={<SceneIllustration image={node.image} name={node.name} />}
      title={node.name}
      narrative={<StoryText text={node.description} className="description" />}
      actions={
        <>
          {(availableEvents.length > 0 || completedEvents.length > 0) && (
            <div>
              <h3 className="section-heading">{t('node.section_events')}</h3>
              {availableEvents.map(({ id, event }) => (
                <button key={id} className={`btn-event${event!.harsh ? ' btn-event--harsh' : ''}`} onClick={() => { playSfx('page_turn'); enterEvent(id); }}>
                  {event!.prompt || event!.description}
                </button>
              ))}
              {completedEvents.map(({ id, event }) => (
                <div key={id} className="event-done">
                  {event!.prompt || event!.description}
                </div>
              ))}
            </div>
          )}

          {node.connections.length > 0 && (
            <div>
              <h3 className="section-heading">{t('node.section_navigate')}</h3>
              {node.connections.map((conn) => {
                const traversable = canTraverse(gameState, conn);
                return (
                  <button
                    key={conn.target}
                    className="btn-nav"
                    onClick={() => { playSfx('move_node'); moveToNode(conn.target); }}
                    disabled={!traversable}
                  >
                    {conn.label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      }
    />
  );
}
