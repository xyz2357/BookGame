import { useGame } from '../context/GameContext';
import { getNode } from '../core/DataLoader';
import GameLayout, { SceneIllustration } from './GameLayout';

export default function EventView() {
  const { state, confirmOutcome, clearOutcome, openInventory } = useGame();
  const { currentEvent, lastOutcome, lastMatchType, gameState } = state;
  const node = getNode(gameState.currentNodeId);

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
            <p className="description">{lastOutcome.text}</p>
          </div>
        }
        actions={
          <button
            className="btn-action"
            onClick={isFailure ? clearOutcome : confirmOutcome}
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
      narrative={<p className="description">{currentEvent.description}</p>}
      actions={
        <button className="btn-action" onClick={openInventory}>
          翻开背包
        </button>
      }
    />
  );
}
