import { useEffect, useRef } from 'react';
import { useGame, canTraverse } from '../context/GameContext';
import { getNode, getEvent } from '../core/DataLoader';
import { applyEffects } from '../core/EffectApplier';
import { completeEvent } from '../core/GameState';

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
        autoEventApplied(newState, outcome);
        break;
      }
    }
  }, [gameState.currentNodeId]);

  if (!node) return <div>未知区域</div>;

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
      <div>
        <h2>{node.name}</h2>
        <div className="result-panel result-panel--success">
          <p className="description">{lastOutcome.text}</p>
        </div>
        <button className="btn-primary" onClick={clearOutcome}>继续</button>
      </div>
    );
  }

  return (
    <div className="node-layout">
      <div className="node-layout__story">
        <h2>{node.name}</h2>
        <p className="description">{node.description}</p>
      </div>

      <div className="node-layout__actions">
        {(availableEvents.length > 0 || completedEvents.length > 0) && (
          <div>
            <h3 className="section-heading">事件</h3>
            {availableEvents.map(({ id, event }) => (
              <button key={id} className={`btn-event${event!.harsh ? ' btn-event--harsh' : ''}`} onClick={() => enterEvent(id)}>
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
            <h3 className="section-heading">前往</h3>
            {node.connections.map((conn) => {
              const traversable = canTraverse(gameState, conn);
              return (
                <button
                  key={conn.target}
                  className="btn-nav"
                  onClick={() => moveToNode(conn.target)}
                  disabled={!traversable}
                >
                  {conn.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
