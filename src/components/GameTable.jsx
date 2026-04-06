import React, { useState, useRef, useEffect } from 'react';
import PlayingCard from './PlayingCard';
import DeclareModal from './DeclareModal';
import Scoreboard from './Scoreboard';
import { suitSymbol } from '../utils/cardUtils';

export default function GameTable({ state, myId, emit }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [showDeclare, setShowDeclare] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [toast, setToast] = useState(null);
  const chatEndRef = useRef(null);

  const g = state.game;
  const myHand = g?.myHand || [];
  const isMyTurn = g?.turnPlayerId === myId;
  const drawnThisTurn = g?.drawnThisTurn;
  const wildJoker = g?.wildJoker;
  const discardTop = g?.discardPile?.slice(-1)[0];
  const showScoreboard = g?.status === 'declared' || state.status === 'finished';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
    emit('discardCard', { code: state.code, cardId: selectedCards[0].id });
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

  // Listen for chat from others
  useEffect(() => {
    // Chat is handled by App via socket, pass messages down
  }, []);

  const myName = state.players.find(p => p.id === myId)?.name || '';
  const currentTurnPlayer = state.players.find(p => p.id === g?.turnPlayerId);

  return (
    <div className="table-felt" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>DSG Fun Lovers</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{state.variant?.toUpperCase()} · Deal {state.currentDeal}</div>
        </div>
        {wildJoker && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>WILD JOKER</div>
            <PlayingCard card={wildJoker} wildJoker={null} small />
          </div>
        )}
        <button className="btn-danger" onClick={handleDrop} style={{ fontSize: 12, padding: '6px 12px' }}>
          Drop
        </button>
      </div>

      {/* Opponents */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 14px', flexWrap: 'wrap' }}>
        {state.players.filter(p => p.id !== myId).map(p => (
          <div key={p.id} className={`player-seat${p.isTurn ? ' active-turn' : ''}`}>
            <div className="avatar">{p.name[0].toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                {p.cardCount} cards
                {!p.connected && ' · ⚡ disconnected'}
              </div>
            </div>
            {p.isTurn && <span className="badge gold" style={{ fontSize: 10 }}>Turn</span>}
          </div>
        ))}
      </div>

      {/* Turn indicator */}
      <div style={{ textAlign: 'center', padding: '6px', fontSize: 13, color: isMyTurn ? 'var(--gold)' : 'var(--text3)' }}>
        {isMyTurn
          ? (drawnThisTurn ? '✨ Select a card to discard or Declare' : '🎯 Your turn — Draw a card')
          : `⏳ ${currentTurnPlayer?.name || ''}'s turn`}
      </div>

      {/* Center - deck and discard */}
      <div className="discard-area">
        {/* Deck */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>DECK ({g?.deckCount})</div>
          <div onClick={handleDrawDeck} style={{ opacity: (!isMyTurn || drawnThisTurn) ? 0.5 : 1 }}>
            <PlayingCard faceDown card={{ id: 'back' }} />
          </div>
        </div>

        {/* Discard pile */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>DISCARD</div>
          <div onClick={handleDrawDiscard} style={{ opacity: (!isMyTurn || drawnThisTurn) ? 0.5 : 1 }}>
            {discardTop
              ? <PlayingCard card={discardTop} wildJoker={wildJoker} />
              : <div className="playing-card" style={{ opacity: 0.3 }}>Empty</div>
            }
          </div>
        </div>
      </div>

      {/* My hand */}
      <div style={{ padding: '0 10px', marginTop: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, paddingLeft: 4 }}>
          YOUR HAND ({myHand.length} cards) {selectedCards.length > 0 && `· ${selectedCards.length} selected`}
        </div>
        <div className="hand-scroll">
          {myHand.map(card => (
            <PlayingCard
              key={card.id}
              card={card}
              wildJoker={wildJoker}
              selected={!!selectedCards.find(c => c.id === card.id)}
              onClick={() => toggleSelect(card)}
            />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 14px 10px' }}>
        <button
          className="btn-primary"
          onClick={handleDiscard}
          disabled={!isMyTurn || !drawnThisTurn || selectedCards.length !== 1}
          style={{
            flex: 1, fontSize: 14, padding: '10px',
            opacity: (!isMyTurn || !drawnThisTurn || selectedCards.length !== 1) ? 0.4 : 1
          }}
        >
          ↓ Discard
        </button>
        <button
          className="btn-primary"
          onClick={() => setShowDeclare(true)}
          disabled={!isMyTurn || !drawnThisTurn}
          style={{
            flex: 1, fontSize: 14, padding: '10px',
            background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
            opacity: (!isMyTurn || !drawnThisTurn) ? 0.4 : 1
          }}
        >
          📋 Declare
        </button>
      </div>

      {/* Chat */}
      <div style={{ padding: '0 14px 14px' }}>
        <div className="chat-box">
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center', margin: 'auto' }}>
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
            <input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit" className="chat-send">Send</button>
          </form>
        </div>
      </div>

      {/* Modals */}
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
