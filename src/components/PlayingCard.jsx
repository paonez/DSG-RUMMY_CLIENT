import React from 'react';
import { suitSymbol, cardColor, isWildJoker } from '../utils/cardUtils';

export default function PlayingCard({ card, selected, onClick, faceDown, small, wildJoker }) {
  if (faceDown) {
    return (
      <div className={`playing-card face-down${small ? ' small' : ''}`} onClick={onClick}>
        <span style={{ fontSize: 20 }}>🂠</span>
      </div>
    );
  }

  const isJK = card.rank === 'JK';
  const isWild = !isJK && wildJoker && isWildJoker(card, wildJoker);
  const color = isJK ? 'joker' : cardColor(card);

  return (
    <div
      className={`playing-card ${color}${selected ? ' selected' : ''}${small ? ' small' : ''}`}
      onClick={onClick}
      title={isWild ? 'Wild Joker' : ''}
      style={isWild ? { outline: '2px solid #9b59b6' } : {}}
    >
      <div className="corner tl">
        <div>{isJK ? '★' : card.rank}</div>
        <div>{isJK ? '' : suitSymbol(card.suit)}</div>
      </div>
      <div className="rank">{isJK ? '★' : card.rank}</div>
      <div className="suit">{isJK ? 'JOKER' : suitSymbol(card.suit)}</div>
      <div className="corner br">
        <div>{isJK ? '★' : card.rank}</div>
        <div>{isJK ? '' : suitSymbol(card.suit)}</div>
      </div>
      {isWild && (
        <div style={{
          position: 'absolute', bottom: 2, right: 2,
          fontSize: 8, background: '#9b59b6', color: '#fff',
          padding: '1px 3px', borderRadius: 3, fontWeight: 700
        }}>W</div>
      )}
    </div>
  );
}
