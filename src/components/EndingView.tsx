import { useGame } from '../context/GameContext';
import StoryText from './StoryText';
import { t } from '../core/I18n';
import { SceneIllustration } from './GameLayout';

export default function EndingView() {
  const { state, returnToMenu } = useGame();
  const { ending, gameState } = state;

  if (!ending) return null;

  const stats = [
    { label: t('ending.stat_books'), value: gameState.inventory.length },
    { label: t('ending.stat_events'), value: gameState.completedEvents.length },
    { label: t('ending.stat_nodes'), value: gameState.visitedNodes.length },
    { label: t('ending.stat_super'), value: gameState.triggeredSuperMatches.length },
  ];

  const paragraphs = ending.text.split('\n').filter(p => p.trim());

  return (
    <div className="ending-view">
      <div className="ending-ornament">✦</div>
      <h1 className="ending-title">{ending.name}</h1>
      {ending.image && (
        <div className="ending-illustration">
          <SceneIllustration image={ending.image} kind="endings" name={ending.name} />
        </div>
      )}
      <div className="ending-text">
        {paragraphs.map((p, i) => (
          <StoryText key={i} text={p} className="ending-paragraph" />
        ))}
      </div>
      <div className="ending-stats">
        {stats.map(s => (
          <div key={s.label} className="ending-stat">
            <span className="ending-stat__value">{s.value}</span>
            <span className="ending-stat__label">{s.label}</span>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={returnToMenu}>{t('ending.back_to_menu')}</button>
    </div>
  );
}
