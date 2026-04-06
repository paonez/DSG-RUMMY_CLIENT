import React, { useState } from 'react';
import PlayingCard from './PlayingCard';
import { validateMeldClient, getMeldLabel } from '../utils/cardUtils';

export default function DeclareModal({ hand, wildJoker, onDeclare, onClose }) {
  const [melds, setMelds] = useState([[]]);
  const [unassigned, setUnassigned] = useState([...hand]);
  const [selectedCard, setSelectedCard] = useState(null); // { cardId, from: 'unassigned'|meldIndex }

  function selectFromUnassigned(card) {
    if (selectedCard?.cardId === card.id) { setSelectedCard(null); return; }
    setSelectedCard({ cardId: card.id, from: 'unassigned' });
  }

  function selectFromMeld(card, meldIdx) {
    if (selectedCard?.cardId === card.id) { setSelectedCard(null); return; }
    setSelectedCard({ cardId: card.id, from: meldIdx });
  }

  function moveToMeld(targetMeldIdx) {
    if (!selectedCard) return;
    let card;
    const newUnassigned = [...unassigned];
    const newMelds = melds.map(m => [...m]);

    if (selectedCard.from === 'unassigned') {
      const idx = newUnassigned.findIndex(c => c.id === selectedCard.cardId);
      if (idx === -1) return;
      [card] = newUnassigned.splice(idx, 1);
    } else {
      const idx = newMelds[selectedCard.from].findIndex(c => c.id === selectedCard.cardId);
      if (idx === -1) return;
      [card] = newMelds[selectedCard.from].splice(idx, 1);
    }

    newMelds[targetMeldIdx].push(card);
    setUnassigned(newUnassigned);
    setMelds(newMelds);
    setSelectedCard(null);
  }

  function moveToUnassigned() {
    if (!selectedCard || selectedCard.from === 'unassigned') return;
    const newMelds = melds.map(m => [...m]);
    const newUnassigned = [...unassigned];
    const idx = newMelds[selectedCard.from].findIndex(c => c.id === selectedCard.cardId);
    if (idx === -1) return;
    const [card] = newMelds[selectedCard.from].splice(idx, 1);
    newUnassigned.push(card);
    setUnassigned(newUnassigned);
    setMelds(newMelds);
    setSelectedCard(null);
  }

  function addMeld() { setMelds([...melds, []]); }
  function removeMeld(idx) {
    const newMelds = [...melds];
    const removed = newMelds.splice(idx, 1)[0];
    setUnassigned([...unassigned, ...removed]);
    setMelds(newMelds);
  }

  function handleDeclare() {
    const nonEmpty = melds.filter(m => m.length > 0);
    onDeclare(nonEmpty);
  }

  const hasPure = melds.some(m => {
    const r = validateMeldClient(m, wildJoker);
    return r.type === 'pure_sequence';
  });
  const allValid = melds.filter(m => m.length > 0).every(m => validateMeldClient(m, wildJoker).valid);
  const seqCount = melds.filter(m => {
    const r = validateMeldClient(m, wildJoker);
    return r.type === 'pure_sequence' || r.type === 'impure_sequence';
  }).length;
  const canDeclare = unassigned.length === 0 && allValid && hasPure && seqCount >= 2;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 560 }}>
        <h2>📋 Declare</h2>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
          Arrange all 13 cards into melds. Need at least 2 sequences (1 pure).
        </p>

        {/* Validation badges */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span className={`badge ${hasPure ? 'green' : 'red'}`}>
            {hasPure ? '✓' : '✗'} Pure sequence
          </span>
          <span className={`badge ${seqCount >= 2 ? 'green' : 'red'}`}>
            {seqCount >= 2 ? '✓' : '✗'} 2+ sequences
          </span>
          <span className={`badge ${allValid ? 'green' : 'red'}`}>
            {allValid ? '✓' : '✗'} All melds valid
          </span>
          <span className={`badge ${unassigned.length === 0 ? 'green' : 'red'}`}>
            {unassigned.length === 0 ? '✓' : '✗'} All cards placed
          </span>
        </div>

        {/* Unassigned */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6, fontWeight: 500 }}>
            UNASSIGNED ({unassigned.length})
            {selectedCard && selectedCard.from !== 'unassigned' && (
              <button onClick={moveToUnassigned} style={{
                marginLeft: 10, fontSize: 11, background: 'rgba(255,255,255,0.1)',
                color: 'var(--text2)', padding: '2px 8px', borderRadius: 4
              }}>← Move here</button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 40 }}>
            {unassigned.map(card => (
              <PlayingCard
                key={card.id} card={card} wildJoker={wildJoker}
                selected={selectedCard?.cardId === card.id}
                onClick={() => selectFromUnassigned(card)}
              />
            ))}
            {unassigned.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>All cards placed</span>
            )}
          </div>
        </div>

        {/* Melds */}
        {melds.map((meld, idx) => {
          const validation = validateMeldClient(meld, wildJoker);
          const isValid = meld.length >= 3 && validation.valid;
          const isInvalid = meld.length >= 3 && !validation.valid;
          return (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>
                  MELD {idx + 1}
                </span>
                {meld.length >= 3 && (
                  <span className={`badge ${isValid ? 'green' : 'red'}`}>
                    {isValid ? getMeldLabel(validation.type) : 'Invalid'}
                  </span>
                )}
                {selectedCard && (
                  <button onClick={() => moveToMeld(idx)} style={{
                    fontSize: 11, background: 'rgba(201,168,76,0.15)',
                    color: 'var(--gold)', padding: '2px 8px', borderRadius: 4
                  }}>+ Add here</button>
                )}
                {melds.length > 1 && meld.length === 0 && (
                  <button onClick={() => removeMeld(idx)} style={{
                    fontSize: 11, background: 'rgba(231,76,60,0.1)',
                    color: '#e74c3c', padding: '2px 6px', borderRadius: 4
                  }}>Remove</button>
                )}
              </div>
              <div className={`meld-group ${isValid ? 'valid' : isInvalid ? 'invalid' : ''}`}>
                {meld.map(card => (
                  <PlayingCard
                    key={card.id} card={card} wildJoker={wildJoker}
                    selected={selectedCard?.cardId === card.id}
                    onClick={() => selectFromMeld(card, idx)}
                  />
                ))}
                {meld.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text3)', padding: '4px 8px' }}>
                    {selectedCard ? 'Click "+ Add here" above' : 'Empty meld'}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <button onClick={addMeld} className="btn-secondary" style={{ marginBottom: 16, fontSize: 13 }}>
          + Add Meld Group
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            onClick={handleDeclare}
            disabled={!canDeclare}
            style={!canDeclare ? { opacity: 0.4 } : {}}
          >
            ✓ Declare
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ marginTop: 0 }}>Cancel</button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12, textAlign: 'center' }}>
          Invalid declaration = 80 point penalty
        </p>
      </div>
    </div>
  );
}
