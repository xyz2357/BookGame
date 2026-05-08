import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { getBook } from '../core/DataLoader';
import type { Book, BookInstance } from '../core/types';

const stateLabels: Record<string, string> = {
  normal: '',
  worn: '磨损',
  glowing: '发光',
  consumed: '消耗',
};

function getEventHintTags(event: { solutions: Array<{ required_tags?: string[] }> }): Set<string> {
  const tags = new Set<string>();
  for (const sol of event.solutions) {
    if (sol.required_tags) {
      for (const t of sol.required_tags) tags.add(t);
    }
  }
  return tags;
}

function computeRelevance(book: Book, hintTags: Set<string>): number {
  if (hintTags.size === 0) return 0;
  let count = 0;
  for (const tag of book.tags) {
    if (hintTags.has(tag)) count++;
  }
  return count;
}

export default function InventoryView() {
  const { state, closeInventory, useBook } = useGame();
  const { gameState, currentEvent, previousScreen } = state;
  const isSelectMode = previousScreen === 'event_view' && !!currentEvent;

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const hintTags = useMemo(
    () => (isSelectMode && currentEvent ? getEventHintTags(currentEvent) : new Set<string>()),
    [isSelectMode, currentEvent]
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const inst of gameState.inventory) {
      const book = getBook(inst.bookId);
      if (book) book.tags.forEach(t => tags.add(t));
    }
    return Array.from(tags).sort();
  }, [gameState.inventory]);

  const filteredAndSorted = useMemo(() => {
    let items: Array<{ inst: BookInstance; book: Book }> = [];
    for (const inst of gameState.inventory) {
      const book = getBook(inst.bookId);
      if (!book) continue;
      if (searchText && !book.title.includes(searchText) && !book.author.includes(searchText)) continue;
      if (activeTag && !book.tags.includes(activeTag)) continue;
      items.push({ inst, book });
    }
    if (isSelectMode) {
      items.sort((a, b) => computeRelevance(b.book, hintTags) - computeRelevance(a.book, hintTags));
    }
    return items;
  }, [gameState.inventory, searchText, activeTag, isSelectMode, hintTags]);

  const selectedBook = selectedBookId ? getBook(selectedBookId) : null;
  const selectedInstance = selectedBookId
    ? gameState.inventory.find((b) => b.bookId === selectedBookId)
    : null;

  return (
    <div>
      <h2>{isSelectMode ? '选择一本书' : '背包'}</h2>

      <div className="inventory-toolbar">
        <input
          className="inventory-search"
          type="text"
          placeholder="搜索书名…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div className="inventory-tags">
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag-filter${activeTag === tag ? ' active' : ''}${isSelectMode && hintTags.has(tag) ? ' hint' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="inventory-layout">
        <div className="inventory-list">
          {filteredAndSorted.map(({ inst, book }) => {
            const isRelevant = isSelectMode && computeRelevance(book, hintTags) > 0;
            const badge = stateLabels[inst.state];
            return (
              <div
                key={inst.bookId}
                className={`book-card${selectedBookId === inst.bookId ? ' selected' : ''}${inst.state === 'glowing' ? ' glowing' : ''}${isRelevant ? ' book-card--hint' : ''}`}
                onClick={() => setSelectedBookId(inst.bookId)}
              >
                <div className="book-card__body">
                  {book.image && (
                    <img className="book-card__thumb" src={`${import.meta.env.BASE_URL}images/books/${book.image}`} alt="" />
                  )}
                  <div>
                    <span className="book-card__title">《{book.title}》</span>
                    {badge && <span className="book-card__badge">{badge}</span>}
                    <div className="book-card__quote">{book.quote}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredAndSorted.length === 0 && (
            <p className="inventory-empty">没有匹配的书。</p>
          )}
        </div>

        {selectedBook && selectedInstance && (
          <div className="inventory-detail">
            <div className="detail-panel">
              {selectedBook.image && (
                <div className="book-cover">
                  <img src={`${import.meta.env.BASE_URL}images/books/${selectedBook.image}`} alt={selectedBook.title} />
                </div>
              )}
              <h3>《{selectedBook.title}》</h3>
              <p className="detail-field"><strong>作者</strong>{selectedBook.author}</p>
              <p className="detail-field"><strong>引言</strong><em>"{selectedBook.quote}"</em></p>
              <div className="detail-field">
                <strong>标签</strong>
                <div className="tag-list">
                  {selectedBook.tags.map(tag => (
                    <span key={tag} className={`tag-item${isSelectMode && hintTags.has(tag) ? ' tag-item--hint' : ''}`}>{tag}</span>
                  ))}
                </div>
              </div>
              <p className="detail-field"><strong>状态</strong>{stateLabels[selectedInstance.state] || '正常'}</p>
              <p className="description">{selectedBook.description}</p>

              {isSelectMode && (
                <button className="btn-primary" onClick={() => useBook(selectedBookId!)} style={{ marginTop: '16px', width: '100%' }}>
                  使用《{selectedBook.title}》
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <button className="btn-secondary" onClick={closeInventory} style={{ marginTop: '20px' }}>
        {isSelectMode ? '返回事件' : '返回游戏'}
      </button>
    </div>
  );
}
