import React, { useState, useRef, useEffect } from 'react';
import PlayingCard from './PlayingCard';
import DeclareModal from './DeclareModal';
import Scoreboard from './Scoreboard';
import { validateMeldClient } from '../utils/cardUtils';

const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUIT_ORDER = { S: 0, H: 1, D: 2, C: 3, JK: 4 };

export default function GameTable({ state, myId, emit }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [showDeclare, setShowDeclare] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [toast, setToast] = useState(null);

  // Local hand order — persists grouping across turns
  const [handOrder, setHandOrder] = useState(null);
  // Groups: array of arrays of card ids. null = no grouping applied yet
  const [groups, setGroups] = useState(null); // [{label, cardIds[]}]
  const [groupTarget, setGroupTarget] = useState(null); // which group index to add selected to

  const chatEndRef = useRef(null);
  const prevHandRef = useRef(null);

  const g = state.game;
  const serverHand = g?.myHand || [];
  const isMyTurn = g?.turnPlayerId === myId;
  const drawnThisTurn = g?.drawnThisTurn;
  const wildJoker = g?.wildJoker;
  const discardTop = g?.discardPile?.slice(-1)[0];
  const showScoreboard = g?.status === 'declared' || state.status === 'finished';

  // Sync hand order when server hand changes (new card drawn etc.)
  useEffect(() => {
    if (!serverHand.length) return;
    const prevIds = (prevHandRef.current || []).map(c => c.id).sort().join(',');
    const newIds = serverHand.map(c => c.id).sort().join(',');
    if (prevIds === newIds) return; // no real change
    prevHandRef.current = serverHand;

    if (!handOrder) {
      setHandOrder(serverHand.map(c => c.id));
      return;
    }
    // Merge: keep existing order, append new cards at end
    const existing = handOrder.filter(id => serverHand.find(c => c.id === id));
    const added = serverHand.filter(c => !handOrder.includes(c.id)).map(c => c.id);
    setHandOrder([...existing, ...added]);
  }, [serverHand]);

  // Build display hand from handOrder
  const myHand = handOrder
    ? handOrder.map(id => serverHand.find(c => c.id === id)).filter(Boolean)
    : serverHand;

  // Initialize groups when game starts
  useEffect(() => {
    if (serverHand.length > 0 && !groups) {
      setGroups([
        { label: 'Group 1', cardIds: [] },
        { label: 'Group 2', cardIds: [] },
        { label: 'Group 3', cardIds: [] },
        { label: 'Group 4', cardIds: [] },
      ]);
    }
  }, [serverHand.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Listen for chat events from other players
  useEffect(() => {
    function onChat(e) {
      setChatMessages(prev => [...prev, e.detail]);
    }
    window.addEventListener('dsg_chat', onChat);
    return () => window.removeEventListener('dsg_chat', onChat);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  function toggleSelect(card) {
    setSelectedCards(prev =>
      prev.find(c => c.id === card.id)
        ? prev.filter(c => c.id !== card.id)
        : [...prev, card]
    );
  }

  function handleDrawDeck() {
    if (!isMyTurn || drawnThisTurn) return;
    emit('drawDeck', { code: state.code });
  }

  function handleDrawDiscard() {
    if (!isMyTurn || drawnThisTurn) return;
    emit('drawDiscard', { code: state.code });
  }

  function handleDiscard() {
    if (!isMyTurn || !drawnThisTurn) return;
    if (selectedCards.length !== 1) { showToast('Select exactly 1 card to discard'); return; }
    const discardId = selectedCards[0].id;
    // Remove from groups too
    setGroups(prev => prev?.map(g => ({ ...g, cardIds: g.cardIds.filter(id => id !== discardId) })));
    setHandOrder(prev => prev?.filter(id => id !== discardId));
    emit('discardCard', { code: state.code, cardId: discardId });
    setSelectedCards([]);
  }

  function handleDrop() {
    if (window.confirm('Are you sure you want to drop? You will receive a penalty.')) {
      emit('drop', { code: state.code });
    }
  }

  function handleDeclare(melds) {
    emit('declare', { code: state.code, melds });
    setShowDeclare(false);
  }

  function sendChat(e) {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    const me = state.players.find(p => p.id === myId);
    emit('chat', { code: state.code, message: chatMsg.trim(), name: me?.name || 'You' });
    setChatMessages(prev => [...prev, { name: 'You', message: chatMsg.trim(), ts: Date.now() }]);
    setChatMsg('');
  }

  // ── GROUPING FUNCTIONS ──

  function addSelectedToGroup(groupIdx) {
    if (!selectedCards.length) { showToast('Tap cards first, then tap a group'); return; }
    const ids = selectedCards.map(c => c.id);
    setGroups(prev => prev.map((g, i) => {
      // Remove these cards from all groups first
      const cleaned = g.cardIds.filter(id => !ids.includes(id));
      if (i === groupIdx) return { ...g, cardIds: [...cleaned, ...ids] };
      return { ...g, cardIds: cleaned };
    }));
    // Reorder hand: move selected cards together at position of first selected in hand
    setHandOrder(prev => {
      if (!prev) return prev;
      const firstIdx = prev.findIndex(id => ids.includes(id));
      const without = prev.filter(id => !ids.includes(id));
      without.splice(firstIdx, 0, ...ids);
      return without;
    });
    setSelectedCards([]);
    showToast(`Moved ${ids.length} card${ids.length > 1 ? 's' : ''} to Group ${groupIdx + 1}`);
  }

  function removeFromGroup(cardId, groupIdx) {
    setGroups(prev => prev.map((g, i) =>
      i === groupIdx ? { ...g, cardIds: g.cardIds.filter(id => id !== cardId) } : g
    ));
  }

  function clearGroup(groupIdx) {
    setGroups(prev => prev.map((g, i) =>
      i === groupIdx ? { ...g, cardIds: [] } : g
    ));
  }

  function sortBySuit() {
    const sorted = [...myHand].sort((a, b) =>
      SUIT_ORDER[a.suit] !== SUIT_ORDER[b.suit]
        ? SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
        : RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
    );
    setHandOrder(sorted.map(c => c.id));
    showToast('Sorted by suit');
  }

  function sortByRank() {
    const sorted = [...myHand].sort((a, b) =>
      RANKS.indexOf(a.rank) !== RANKS.indexOf(b.rank)
        ? RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
        : SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
    );
    setHandOrder(sorted.map(c => c.id));
    showToast('Sorted by rank');
  }

  function sortByGroups() {
    if (!groups) return;
    const grouped = groups.flatMap(g => g.cardIds);
    const ungrouped = myHand.map(c => c.id).filter(id => !grouped.includes(id));
    setHandOrder([...grouped, ...ungrouped]);
    showToast('Sorted by groups');
  }

  // Get group index of a card (for color coding)
  function getCardGroup(cardId) {
    if (!groups) return -1;
    return groups.findIndex(g => g.cardIds.includes(cardId));
  }

  const GROUP_COLORS = [
    { bg: 'rgba(52,152,219,0.25)', border: '#3498db', label: '#74b9ff' },   // blue
    { bg: 'rgba(46,204,113,0.25)', border: '#2ecc71', label: '#55efc4' },   // green
    { bg: 'rgba(231,76,60,0.25)',  border: '#e74c3c', label: '#ff7675' },   // red
    { bg: 'rgba(155,89,182,0.25)', border: '#9b59b6', label: '#a29bfe' },   // purple
  ];

  const currentTurnPlayer = state.players.find(p => p.id === g?.turnPlayerId);

  return (
    <div className="table-felt" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast && <div className="toast">{toast}</div>}

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px', background: 'rgba(0,0,0,0.35)', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>DSG Fun Lovers</div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{state.variant?.toUpperCase()} · Deal {state.currentDeal}</div>
        </div>
        {wildJoker && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 2 }}>WILD JOKER</div>
            <PlayingCard card={wildJoker} wildJoker={null} />
          </div>
        )}
        <button className="btn-danger" onClick={handleDrop} style={{ fontSize: 11, padding: '5px 10px' }}>
          Drop
        </button>
      </div>

      {/* ── OPPONENTS ── */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 14px', flexWrap: 'wrap', flexShrink: 0 }}>
        {state.players.filter(p => p.id !== myId).map(p => (
          <div key={p.id} className={`player-seat${p.isTurn ? ' active-turn' : ''}`} style={{ padding: '5px 10px' }}>
            <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>{p.name[0].toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 12 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{p.cardCount} cards{!p.connected && ' ⚡'}</div>
            </div>
            {p.isTurn && <span className="badge gold" style={{ fontSize: 9 }}>Turn</span>}
          </div>
        ))}
      </div>

      {/* ── TURN INDICATOR ── */}
      <div style={{ textAlign: 'center', padding: '4px', fontSize: 12, color: isMyTurn ? 'var(--gold)' : 'var(--text3)', flexShrink: 0 }}>
        {isMyTurn
          ? (drawnThisTurn ? '✨ Select 1 card → Discard, or Declare' : '🎯 Your turn — Draw from deck or discard pile')
          : `⏳ ${currentTurnPlayer?.name || ''}'s turn`}
      </div>

      {/* ── DECK + DISCARD ── */}
      <div className="discard-area" style={{ flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 3 }}>DECK ({g?.deckCount})</div>
          <div onClick={handleDrawDeck} style={{ opacity: (!isMyTurn || drawnThisTurn) ? 0.45 : 1, cursor: isMyTurn && !drawnThisTurn ? 'pointer' : 'default' }}>
            <PlayingCard faceDown card={{ id: 'back' }} />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 3 }}>DISCARD</div>
          <div onClick={handleDrawDiscard} style={{ opacity: (!isMyTurn || drawnThisTurn) ? 0.45 : 1, cursor: isMyTurn && !drawnThisTurn ? 'pointer' : 'default' }}>
            {discardTop
              ? <PlayingCard card={discardTop} wildJoker={wildJoker} />
              : <div className="playing-card" style={{ opacity: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>Empty</div>
            }
          </div>
        </div>
      </div>

      {/* ── MY HAND ── */}
      <div style={{ padding: '0 10px', marginTop: 'auto', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            YOUR HAND ({myHand.length})
            {selectedCards.length > 0 && <span style={{ color: 'var(--gold)', marginLeft: 6 }}>· {selectedCards.length} selected</span>}
          </span>
          {/* Sort + Group toggle buttons */}
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={sortBySuit} style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--text2)'
            }}>♠ Suit</button>
            <button onClick={sortByRank} style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--text2)'
            }}>A-K</button>
            <button onClick={() => setShowGroupPanel(v => !v)} style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 6,
              background: showGroupPanel ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${showGroupPanel ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
              color: showGroupPanel ? 'var(--gold)' : 'var(--text2)',
              fontWeight: showGroupPanel ? 600 : 400,
            }}>⊞ Groups</button>
          </div>
        </div>

        {/* Hand scroll */}
        <div className="hand-scroll">
          {myHand.map(card => {
            const grpIdx = getCardGroup(card.id);
            const grpColor = grpIdx >= 0 ? GROUP_COLORS[grpIdx] : null;
            return (
              <div key={card.id} style={{ position: 'relative', flexShrink: 0 }}>
                {/* Group color indicator dot */}
                {grpColor && (
                  <div style={{
                    position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
                    width: 8, height: 8, borderRadius: '50%',
                    background: grpColor.border, zIndex: 2,
                    boxShadow: `0 0 4px ${grpColor.border}`,
                  }} />
                )}
                <PlayingCard
                  card={card}
                  wildJoker={wildJoker}
                  selected={!!selectedCards.find(c => c.id === card.id)}
                  onClick={() => toggleSelect(card)}
                />
                {/* Group label under card */}
                {grpColor && (
                  <div style={{
                    textAlign: 'center', fontSize: 8, fontWeight: 700,
                    color: grpColor.label, marginTop: 1, lineHeight: 1,
                  }}>G{grpIdx + 1}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── GROUP PANEL ── */}
      {showGroupPanel && groups && (
        <div style={{
          margin: '6px 14px 0',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>
              ⊞ CARD GROUPS
              {selectedCards.length > 0 && (
                <span style={{ color: 'var(--text2)', fontWeight: 400, marginLeft: 6 }}>
                  — {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''} selected → tap a group to assign
                </span>
              )}
            </span>
            <button onClick={sortByGroups} style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 5,
              background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
              color: 'var(--gold)'
            }}>Sort hand by groups</button>
          </div>

          {/* Group rows */}
          <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {groups.map((grp, idx) => {
              const color = GROUP_COLORS[idx];
              const grpCards = grp.cardIds.map(id => myHand.find(c => c.id === id)).filter(Boolean);
              const validation = grpCards.length >= 3 ? validateMeldClient(grpCards, wildJoker) : null;
              const isValid = validation?.valid;
              const isInvalid = grpCards.length >= 3 && !isValid;
              const canAdd = selectedCards.length > 0;

              return (
                <div key={idx} style={{
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  borderRadius: 8, padding: '6px 10px',
                  opacity: 1,
                }}>
                  {/* Group header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: grpCards.length > 0 ? 6 : 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: color.label }}>
                      {grp.label}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                      {grpCards.length} card{grpCards.length !== 1 ? 's' : ''}
                    </span>
                    {/* Validation badge */}
                    {grpCards.length >= 3 && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                        background: isValid ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)',
                        color: isValid ? '#27ae60' : '#e74c3c',
                      }}>
                        {isValid ? `✓ ${validation.type === 'pure_sequence' ? 'Pure Seq' : validation.type === 'impure_sequence' ? 'Seq' : 'Set'}` : '✗ Invalid'}
                      </span>
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                      {/* ADD selected cards button */}
                      <button
                        onClick={() => addSelectedToGroup(idx)}
                        disabled={!canAdd}
                        style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 5,
                          background: canAdd ? color.bg : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${canAdd ? color.border : 'rgba(255,255,255,0.1)'}`,
                          color: canAdd ? color.label : 'rgba(255,255,255,0.25)',
                          fontWeight: 600, cursor: canAdd ? 'pointer' : 'not-allowed',
                        }}
                      >
                        + Add selected
                      </button>
                      {grpCards.length > 0 && (
                        <button onClick={() => clearGroup(idx)} style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 5,
                          background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)',
                          color: '#e74c3c',
                        }}>Clear</button>
                      )}
                    </div>
                  </div>

                  {/* Cards in group */}
                  {grpCards.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {grpCards.map(card => (
                        <div key={card.id} style={{ position: 'relative' }}>
                          <PlayingCard
                            card={card} wildJoker={wildJoker}
                            selected={!!selectedCards.find(c => c.id === card.id)}
                            onClick={() => toggleSelect(card)}
                          />
                          {/* Remove from group × */}
                          <button
                            onClick={e => { e.stopPropagation(); removeFromGroup(card.id, idx); }}
                            style={{
                              position: 'absolute', top: -5, right: -5,
                              width: 14, height: 14, borderRadius: '50%',
                              background: '#e74c3c', border: 'none',
                              color: '#fff', fontSize: 9, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', zIndex: 5, lineHeight: 1,
                            }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {grpCards.length === 0 && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                      Select cards from your hand, then tap "+ Add selected"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACTION BUTTONS ── */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 14px 8px', flexShrink: 0 }}>
        <button
          className="btn-primary"
          onClick={handleDiscard}
          disabled={!isMyTurn || !drawnThisTurn || selectedCards.length !== 1}
          style={{
            flex: 1, fontSize: 13, padding: '9px',
            opacity: (!isMyTurn || !drawnThisTurn || selectedCards.length !== 1) ? 0.35 : 1
          }}
        >
          ↓ Discard
        </button>
        <button
          className="btn-primary"
          onClick={() => setShowDeclare(true)}
          disabled={!isMyTurn || !drawnThisTurn}
          style={{
            flex: 1, fontSize: 13, padding: '9px',
            background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
            opacity: (!isMyTurn || !drawnThisTurn) ? 0.35 : 1
          }}
        >
          📋 Declare
        </button>
      </div>

      {/* ── CHAT ── */}
      <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
        <div className="chat-box">
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <span style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center', margin: 'auto' }}>
                Chat with your group
              </span>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className="chat-msg">
                <span className="sender">{m.name}: </span>{m.message}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} className="chat-input-row">
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Type a message..." />
            <button type="submit" className="chat-send">Send</button>
          </form>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showDeclare && (
        <DeclareModal
          hand={myHand}
          wildJoker={wildJoker}
          onDeclare={handleDeclare}
          onClose={() => setShowDeclare(false)}
        />
      )}

      {showScoreboard && (
        <Scoreboard
          state={state}
          myId={myId}
          onNextDeal={() => emit('nextDeal', { code: state.code })}
          onPlayAgain={() => emit('resetRoom', { code: state.code })}
          onLeave={() => window.location.reload()}
        />
      )}
    </div>
  );
}
