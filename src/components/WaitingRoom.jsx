import React from 'react';

const VARIANT_LABELS = {
  points: 'Points Rummy',
  deals: 'Deals Rummy',
  pool101: 'Pool 101',
  pool201: 'Pool 201',
};

export default function WaitingRoom({ state, myId, onStart, onLeave }) {
  const isHost = state.host === myId;
  const canStart = state.players.length >= 2;

  function copyCode() {
    navigator.clipboard?.writeText(state.code);
  }

  return (
    <div className="page">
      <div className="card-surface">
        <div className="logo">
          <h1>♣ DSG Fun Lovers ♠</h1>
          <p>{VARIANT_LABELS[state.variant] || state.variant}</p>
        </div>

        {/* Room Code */}
        <div style={{
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 10,
          padding: '14px',
          textAlign: 'center',
          marginBottom: 20,
          cursor: 'pointer',
        }} onClick={copyCode} title="Click to copy">
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>ROOM CODE — Share with friends</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--gold)' }}>
            {state.code}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Tap to copy</div>
        </div>

        {/* Players */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Players ({state.players.length}/{state.players.length})
          </div>
          {state.players.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: i < state.players.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--green-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, color: 'var(--gold)',
              }}>
                {p.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{p.name}</div>
                {p.id === state.host && <div style={{ fontSize: 11, color: 'var(--gold)' }}>Host</div>}
              </div>
              {p.id === myId && <span className="badge gold">You</span>}
            </div>
          ))}
        </div>

        {isHost ? (
          <>
            <button
              className="btn-primary"
              onClick={onStart}
              disabled={!canStart}
              style={!canStart ? { opacity: 0.5 } : {}}
            >
              {canStart ? '🃏 Start Game' : 'Waiting for players...'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
              Need at least 2 players to start
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>
            ⏳ Waiting for host to start the game...
          </div>
        )}

        <button className="btn-secondary" onClick={onLeave} style={{ marginTop: 12 }}>Leave Room</button>
      </div>
    </div>
  );
}
