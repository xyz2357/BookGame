import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { getBook } from '../core/DataLoader';

function HpCandles({ hp, maxHp }: { hp: number; maxHp: number }) {
  return (
    <div className="hp-candles">
      {Array.from({ length: maxHp }, (_, i) => (
        <span key={i} className={`candle ${i < hp ? 'lit' : 'spent'}`} />
      ))}
    </div>
  );
}

export default function EventView() {
  const { state, useBook, confirmOutcome, clearOutcome } = useGame();
  const { currentEvent, lastOutcome, lastMatchType, gameState } = state;
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  if (!currentEvent) return null;

  if (lastOutcome) {
    const isFailure = lastMatchType === 'default';
    const isHarshFailure = isFailure && !!currentEvent.harsh;
    return (
      <div>
        <HpCandles hp={gameState.hp} maxHp={gameState.maxHp} />
        <div className={`result-panel ${isFailure ? (isHarshFailure ? 'result-panel--failure' : 'result-panel--miss') : 'result-panel--success'}`}>
          {isHarshFailure && <p className="hp-loss">蜡烛熄灭了一根…</p>}
          <p className="description">{lastOutcome.text}</p>
        </div>
        <button
          className="btn-primary"
          onClick={isFailure ? () => { setSelectedBookId(null); clearOutcome(); } : confirmOutcome}
        >
          {isFailure ? '换一本书试试' : '继续'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <HpCandles hp={gameState.hp} maxHp={gameState.maxHp} />
      <p className="description">{currentEvent.description}</p>
      <p className={`event-prompt${currentEvent.harsh ? ' event-prompt--harsh' : ''}`}>{currentEvent.prompt}</p>

      <h3 className="section-heading">选择一本书</h3>
      {gameState.inventory.map((inst) => {
        const book = getBook(inst.bookId);
        if (!book) return null;
        const isSelected = selectedBookId === inst.bookId;
        return (
          <div
            key={inst.bookId}
            className={`book-card${isSelected ? ' selected' : ''}${inst.state === 'glowing' ? ' glowing' : ''}`}
            onClick={() => setSelectedBookId(inst.bookId)}
          >
            <div className="book-card__title">《{book.title}》</div>
            <div className="book-card__quote">{book.quote}</div>
          </div>
        );
      })}

      {selectedBookId && (
        <button className="btn-primary" onClick={() => useBook(selectedBookId)}>
          使用《{getBook(selectedBookId)?.title}》
        </button>
      )}
    </div>
  );
}
