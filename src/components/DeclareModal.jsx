import React, { useState } from 'react';
import PlayingCard from './PlayingCard';
import { validateMeldClient, getMeldLabel } from '../utils/cardUtils';

export default function DeclareModal({ hand, wildJoker, onDeclare, onClose }) {
  const [cardMelds, setCardMelds] = useState(() =>
    hand.map(card => ({ ...card, meldIdx: null }))
  );
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [meldCount, setMeldCount] = useState(4);

  const unassigned = cardMelds.filter(c => c.meldIdx === null);
  const getMeldCards = idx => cardMelds.filter(c => c.meldIdx === idx);

  function handleCardClick(card) {
    if (selectedCardId === card.id) { setSelectedCardId(null); return; }
    setSelectedCardId(card.id);
  }

  function assignToMeld(meldIdx) {
    if (!selectedCardId) return;
    setCardMelds(prev => prev.map(c => c.id === selectedCardId ? { ...c, meldIdx } : c));
    setSelectedCardId(null);
  }

  function sendToUnassigned(cardId) {
    setCardMelds(prev => prev.map(c => c.id === cardId ? { ...c, meldIdx: null } : c));
    setSelectedCardId(null);
  }

  function clearMeld(meldIdx) {
    setCardMelds(prev => prev.map(c => c.meldIdx === meldIdx ? { ...c, meldIdx: null } : c));
    setSelectedCardId(null);
  }

  function autoSort() {
    const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    setCardMelds(prev => {
      const assigned = prev.filter(c => c.meldIdx !== null);
      const unassign = prev
        .filter(c => c.meldIdx === null)
        .sort((a, b) =>
          a.suit !== b.suit
            ? a.suit.localeCompare(b.suit)
            : RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
        );
      return [...assigned, ...unassign];
    });
  }

  const meldsArray = Array.from({ length: meldCount }, (_, i) => getMeldCards(i));
  const nonEmptyMelds = meldsArray.filter(m => m.length > 0);
  const validations = meldsArray.map(m => m.length > 0 ? validateMeldClient(m, wildJoker) : null);
  const hasPure = validations.some(v => v?.type === 'pure_sequence');
  const allNonEmptyValid = nonEmptyMelds.every(m => validateMeldClient(m, wildJoker).valid);
  const seqCount = validations.filter(v => v?.type === 'pure_sequence' || v?.type === 'impure_sequence').length;
  const canDeclare = unassigned.length === 0 && allNonEmptyValid && hasPure && seqCount >= 2;

  const selCard = cardMelds.find(c => c.id === selectedCardId);
  const SUIT_SYM = { S:'♠', H:'♥', D:'♦', C:'♣', JK:'★' };

  function handleDeclare() {
    const finalMelds = nonEmptyMelds.map(m => m.map(({ meldIdx, ...card }) => card));
    onDeclare(finalMelds);
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 580, padding: '1.25rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>📋 Declare</h2>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            color: 'var(--text2)', padding: '4px 10px', borderRadius: 6, fontSize: 13
          }}>✕ Cancel</button>
        </div>

        {/* Instructions */}
        <div style={{
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: 'var(--text2)'
        }}>
          <strong style={{ color: 'var(--gold)' }}>How to group cards:</strong> Tap any card to select it → then tap a <strong style={{ color: 'var(--gold)' }}>Group button</strong> to place it. Tap a grouped card → tap another group or "← Back" to move it.
        </div>

        {/* Validation pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { ok: hasPure, label: 'Pure seq' },
            { ok: seqCount >= 2, label: '2+ seqs' },
            { ok: allNonEmptyValid && nonEmptyMelds.length > 0, label: 'All valid' },
            { ok: unassigned.length === 0, label: 'All placed' },
          ].map(({ ok, label }) => (
            <span key={label} style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              background: ok ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
              color: ok ? '#27ae60' : '#e74c3c',
              border: `1px solid ${ok ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`,
            }}>
              {ok ? '✓' : '✗'} {label}
            </span>
          ))}
        </div>

        {/* ── UNASSIGNED HAND ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.04em' }}>
              YOUR HAND — {unassigned.length} unplaced
            </span>
            <button onClick={autoSort} style={{
              fontSize: 11, background: 'rgba(255,255,255,0.07)',
              color: 'var(--text2)', padding: '3px 10px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>Sort by suit</button>
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 5, minHeight: 52,
            background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 8,
            border: '1px dashed rgba(201,168,76,0.25)',
          }}>
            {unassigned.length === 0
              ? <span style={{ fontSize: 12, color: '#27ae60', alignSelf: 'center', margin: '0 auto' }}>✓ All cards grouped</span>
              : unassigned.map(card => (
                <PlayingCard
                  key={card.id} card={card} wildJoker={wildJoker}
                  selected={selectedCardId === card.id}
                  onClick={() => handleCardClick(card)}
                />
              ))
            }
          </div>
        </div>

        {/* ── SELECTION ACTION BAR ── */}
        {selectedCardId && (
          <div style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.4)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
              Selected: <strong style={{ color: 'var(--gold)', fontSize: 14 }}>
                {selCard?.rank}{selCard ? SUIT_SYM[selCard.suit] : ''}
              </strong>
              {selCard?.meldIdx !== null && (
                <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>
                  (in Group {selCard.meldIdx + 1})
                </span>
              )}
              {' — '}
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Place into:</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* Group buttons */}
              {Array.from({ length: meldCount }, (_, i) => {
                const mCards = getMeldCards(i);
                const v = mCards.length > 0 ? validateMeldClient(mCards, wildJoker) : null;
                const isCurrentGroup = selCard?.meldIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => assignToMeld(i)}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: isCurrentGroup ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.15)',
                      border: `1.5px solid ${isCurrentGroup ? 'var(--gold)' : 'rgba(201,168,76,0.4)'}`,
                      color: 'var(--gold)', cursor: 'pointer',
                    }}
                  >
                    Group {i + 1}
                    {mCards.length > 0 && (
                      <span style={{
                        fontSize: 10, marginLeft: 4,
                        color: v?.valid ? '#27ae60' : (mCards.length >= 3 ? '#e74c3c' : 'var(--text3)')
                      }}>
                        ({mCards.length})
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Move back to unassigned */}
              {selCard?.meldIdx !== null && (
                <button
                  onClick={() => sendToUnassigned(selectedCardId)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 13,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text2)', cursor: 'pointer',
                  }}
                >
                  ← Back to hand
                </button>
              )}

              {/* Deselect */}
              <button
                onClick={() => setSelectedCardId(null)}
                style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text3)', cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ── MELD GROUPS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {Array.from({ length: meldCount }, (_, idx) => {
            const meldCards = getMeldCards(idx);
            const validation = meldCards.length > 0 ? validateMeldClient(meldCards, wildJoker) : null;
            const isValid = validation?.valid && meldCards.length >= 3;
            const isInvalid = meldCards.length >= 3 && !validation?.valid;

            return (
              <div key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--gold)',
                    background: 'rgba(201,168,76,0.15)', padding: '2px 8px',
                    borderRadius: 20, border: '1px solid rgba(201,168,76,0.3)'
                  }}>
                    GROUP {idx + 1}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{meldCards.length} cards</span>
                  {meldCards.length >= 3 && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                      background: isValid ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
                      color: isValid ? '#27ae60' : '#e74c3c',
                    }}>
                      {isValid ? `✓ ${getMeldLabel(validation.type)}` : '✗ Invalid'}
                    </span>
                  )}
                  {meldCards.length > 0 && (
                    <button onClick={() => clearMeld(idx)} style={{
                      fontSize: 10, background: 'rgba(231,76,60,0.08)',
                      color: '#e74c3c', padding: '2px 8px', borderRadius: 4,
                      border: '1px solid rgba(231,76,60,0.2)', marginLeft: 'auto'
                    }}>Clear</button>
                  )}
                </div>

                {/* Clickable meld zone */}
                <div
                  className={`meld-group ${isValid ? 'valid' : isInvalid ? 'invalid' : ''}`}
                  onClick={() => selectedCardId && assignToMeld(idx)}
                  style={{
                    cursor: selectedCardId ? 'pointer' : 'default',
                    minHeight: 50,
                    outline: selectedCardId ? '2px dashed rgba(201,168,76,0.4)' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  {meldCards.length === 0 ? (
                    <span style={{ fontSize: 12, color: selectedCardId ? 'var(--gold)' : 'var(--text3)', padding: 4 }}>
                      {selectedCardId ? '👆 Tap here or use Group button above' : 'Empty — select a card first'}
                    </span>
                  ) : (
                    meldCards.map(card => (
                      <PlayingCard
                        key={card.id} card={card} wildJoker={wildJoker}
                        selected={selectedCardId === card.id}
                        onClick={e => { e.stopPropagation(); handleCardClick(card); }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add/remove groups */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMeldCount(c => Math.min(c + 1, 6))} style={{
            flex: 1, fontSize: 12, background: 'rgba(255,255,255,0.06)',
            color: 'var(--text2)', padding: '7px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>+ Add Group</button>
          <button onClick={() => { if (meldCount <= 1) return; clearMeld(meldCount - 1); setMeldCount(c => c - 1); }} style={{
            flex: 1, fontSize: 12, background: 'rgba(255,255,255,0.06)',
            color: 'var(--text2)', padding: '7px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>− Remove Group</button>
        </div>

        {/* Declare */}
        <button
          className="btn-primary"
          onClick={handleDeclare}
          disabled={!canDeclare}
          style={{ opacity: canDeclare ? 1 : 0.4, fontSize: 15, padding: '12px' }}
        >
          {canDeclare ? '✓ Declare — Submit Hand' : 'Group all 13 cards to declare'}
        </button>

        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10, textAlign: 'center' }}>
          ⚠️ Invalid declaration = 80 point penalty
        </p>
      </div>
    </div>
  );
}
