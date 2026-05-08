import { useGame } from '../context/GameContext';
import { getNode } from '../core/DataLoader';

export default function EventView() {
  const { state, confirmOutcome, clearOutcome, openInventory } = useGame();
  const { currentEvent, lastOutcome, lastMatchType, gameState } = state;
  const node = getNode(gameState.currentNodeId);

  if (!currentEvent) return null;

  const sceneImage = node?.image;

  if (lastOutcome) {
    const isFailure = lastMatchType === 'default';
    const isHarshFailure = isFailure && !!currentEvent.harsh;
    return (
      <div>
        {sceneImage && (
          <div className="scene-illustration">
            <img src={`${import.meta.env.BASE_URL}images/nodes/${sceneImage}`} alt={node?.name || ''} />
          </div>
        )}
        <div className={`result-panel ${isFailure ? (isHarshFailure ? 'result-panel--failure' : 'result-panel--miss') : 'result-panel--success'}`}>
          {isHarshFailure && <p className="hp-loss">蜡烛熄灭了一根…</p>}
          <p className="description">{lastOutcome.text}</p>
        </div>
        <button
          className="btn-primary"
          onClick={isFailure ? clearOutcome : confirmOutcome}
        >
          {isFailure ? '换一本书试试' : '继续'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {sceneImage && (
        <div className="scene-illustration">
          <img src={`${import.meta.env.BASE_URL}images/nodes/${sceneImage}`} alt={node?.name || ''} />
        </div>
      )}
      <p className="description">{currentEvent.description}</p>
      <p className={`event-prompt${currentEvent.harsh ? ' event-prompt--harsh' : ''}`}>{currentEvent.prompt}</p>

      <button className="btn-primary" onClick={openInventory}>
        翻开背包
      </button>
    </div>
  );
}
