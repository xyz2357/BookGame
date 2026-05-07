import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { getBook } from '../core/DataLoader';

const stateLabels: Record<string, string> = {
  normal: '',
  worn: '磨损',
  glowing: '发光',
  consumed: '消耗',
};

export default function InventoryView() {
  const { state, closeInventory } = useGame();
  const { gameState } = state;
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const selectedBook = selectedBookId ? getBook(selectedBookId) : null;
  const selectedInstance = selectedBookId
    ? gameState.inventory.find((b) => b.bookId === selectedBookId)
    : null;

  return (
    <div>
      <h2>背包</h2>

      <div className="inventory-layout">
        <div className="inventory-list">
          {gameState.inventory.map((inst) => {
            const book = getBook(inst.bookId);
            if (!book) return null;
            const badge = stateLabels[inst.state];
            return (
              <div
                key={inst.bookId}
                className={`book-card${selectedBookId === inst.bookId ? ' selected' : ''}${inst.state === 'glowing' ? ' glowing' : ''}`}
                onClick={() => setSelectedBookId(inst.bookId)}
              >
                <span className="book-card__title">《{book.title}》</span>
                {badge && <span className="book-card__badge">{badge}</span>}
              </div>
            );
          })}
        </div>

        {selectedBook && selectedInstance && (
          <div className="inventory-detail">
            <div className="detail-panel">
              <h3>《{selectedBook.title}》</h3>
              <p className="detail-field"><strong>作者</strong>{selectedBook.author}</p>
              <p className="detail-field"><strong>引言</strong><em>"{selectedBook.quote}"</em></p>
              <div className="detail-field">
                <strong>标签</strong>
                <div className="tag-list">
                  {selectedBook.tags.map(tag => (
                    <span key={tag} className="tag-item">{tag}</span>
                  ))}
                </div>
              </div>
              <p className="detail-field"><strong>状态</strong>{stateLabels[selectedInstance.state] || '正常'}</p>
              <p className="description">{selectedBook.description}</p>
            </div>
          </div>
        )}
      </div>

      <button className="btn-secondary" onClick={closeInventory} style={{ marginTop: '20px' }}>返回</button>
    </div>
  );
}
