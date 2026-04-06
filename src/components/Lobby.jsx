import React, { useState } from 'react';

const VARIANTS = [
  { value: 'points', label: 'Points Rummy', desc: 'Single round, lowest score wins' },
  { value: 'deals', label: 'Deals Rummy', desc: 'Fixed number of deals' },
  { value: 'pool101', label: 'Pool 101', desc: 'Eliminated at 101 points' },
  { value: 'pool201', label: 'Pool 201', desc: 'Eliminated at 201 points' },
];

export default function Lobby({ onCreateRoom, onJoinRoom }) {
  const [mode, setMode] = useState('home'); // home | create | join
  const [name, setName] = useState('');
  const [variant, setVariant] = useState('points');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [joinCode, setJoinCode] = useState('');
  const [deals, setDeals] = useState(2);

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateRoom({ name: name.trim(), variant, maxPlayers: parseInt(maxPlayers), totalDeals: parseInt(deals) });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim() || !joinCode.trim()) return;
    onJoinRoom({ name: name.trim(), code: joinCode.trim().toUpperCase() });
  }

  return (
    <div className="page">
      <div className="card-surface">
        <div className="logo">
          <h1>♣ DSG Fun Lovers ♠</h1>
          <p>Online Rummy · Play with your community</p>
        </div>

        {mode === 'home' && (
          <div>
            <button className="btn-primary" onClick={() => setMode('create')}>🎮 Create Room</button>
            <button className="btn-secondary" onClick={() => setMode('join')}>🔑 Join with Code</button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate}>
            <div className="field">
              <label>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" autoFocus maxLength={16} />
            </div>
            <div className="field">
              <label>Game Variant</label>
              <select value={variant} onChange={e => setVariant(e.target.value)}>
                {VARIANTS.map(v => <option key={v.value} value={v.value}>{v.label} — {v.desc}</option>)}
              </select>
            </div>
            {variant === 'deals' && (
              <div className="field">
                <label>Number of Deals</label>
                <select value={deals} onChange={e => setDeals(e.target.value)}>
                  {[2,3,4,6].map(n => <option key={n} value={n}>{n} deals</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label>Max Players</label>
              <select value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)}>
                {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} players</option>)}
              </select>
            </div>
            <button className="btn-primary" type="submit">Create Room</button>
            <button className="btn-secondary" type="button" onClick={() => setMode('home')}>Back</button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin}>
            <div className="field">
              <label>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" autoFocus maxLength={16} />
            </div>
            <div className="field">
              <label>Room Code</label>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="6-letter code"
                maxLength={6}
                style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 20, textAlign: 'center' }}
              />
            </div>
            <button className="btn-primary" type="submit">Join Room</button>
            <button className="btn-secondary" type="button" onClick={() => setMode('home')}>Back</button>
          </form>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        Indian Rummy · 13 cards · 2 decks
      </p>
    </div>
  );
}
