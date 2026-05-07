import { useGame } from '../context/GameContext';

export default function EndingView() {
  const { state, returnToMenu } = useGame();
  const { ending } = state;

  if (!ending) return null;

  return (
    <div className="ending-view">
      <h1 className="ending-title">{ending.name}</h1>
      <p className="ending-text">{ending.text}</p>
      <button className="btn-primary" onClick={returnToMenu}>返回主菜单</button>
    </div>
  );
}
