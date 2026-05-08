import { useGame } from '../context/GameContext';
import StoryText from './StoryText';

export default function EndingView() {
  const { state, returnToMenu } = useGame();
  const { ending, gameState } = state;

  if (!ending) return null;

  const stats = [
    { label: '收集书籍', value: gameState.inventory.length },
    { label: '完成事件', value: gameState.completedEvents.length },
    { label: '探索区域', value: gameState.visitedNodes.length },
    { label: '超级匹配', value: gameState.triggeredSuperMatches.length },
  ];

  const paragraphs = ending.text.split('\n').filter(p => p.trim());

  return (
    <div className="ending-view">
      <div className="ending-ornament">✦</div>
      <h1 className="ending-title">{ending.name}</h1>
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
      <button className="btn-primary" onClick={returnToMenu}>返回主菜单</button>
    </div>
  );
}
