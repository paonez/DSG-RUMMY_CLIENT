import React from 'react';

const VARIANT_LABELS = {
  points: 'Points Rummy',
  deals: 'Deals Rummy',
  pool101: 'Pool 101',
  pool201: 'Pool 201',
};

export default function Scoreboard({ state, myId, onNextDeal, onPlayAgain, onLeave }) {
  const isHost = state.host === myId;
  const variant = state.variant;
  const players = state.players;
  const roundScores = state.game?.roundScores || {};
  const isFinished = state.status === 'finished';

  function getScore(p) {
    if (variant === 'pool101' || variant === 'pool201') return p.scores?.poolTotal ?? 0;
    return p.scores?.total ?? 0;
  }

  function getDealScore(p, deal) {
    return p.scores?.[`deal${deal}`] ?? '-';
  }

  const sorted = [...players].sort((a, b) => getScore(a) - getScore(b));
  const winner = isFinished ? sorted[0] : null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isFinished ? '🏆 Match Over' : '📊 Round Result'}</h2>

        {winner && isFinished && (
          <div style={{
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.4)',
            borderRadius: 10, padding: '12px', marginBottom: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Winner</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>
              🏆 {winner.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
              {getScore(winner)} points {variant === 'points' ? '(lowest)' : ''}
            </div>
          </div>
        )}

        <table className="scoreboard-table">
          <thead>
            <tr>
              <th>Player</th>
              {variant === 'deals' && Array.from({ length: state.totalDeals || 2 }, (_, i) => (
                <th key={i}>D{i + 1}</th>
              ))}
              {Object.keys(roundScores).length > 0 && !isFinished && <th>This Round</th>}
              <th>{variant === 'points' ? 'Points' : variant.startsWith('pool') ? 'Pool Total' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const isWinner = winner?.id === p.id;
              const isElim = (variant === 'pool101' && getScore(p) >= 101) ||
                             (variant === 'pool201' && getScore(p) >= 201);
              return (
                <tr key={p.id} className={isWinner && isFinished ? 'winner' : ''}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--green-mid)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 12, color: 'var(--gold)',
                        flexShrink: 0
                      }}>{p.name[0].toUpperCase()}</div>
                      <span>{p.name}</span>
                      {p.id === myId && <span className="badge gold" style={{ fontSize: 10 }}>You</span>}
                      {isElim && <span className="badge red" style={{ fontSize: 10 }}>Out</span>}
                    </div>
                  </td>
                  {variant === 'deals' && Array.from({ length: state.totalDeals || 2 }, (_, i) => (
                    <td key={i} style={{ textAlign: 'center' }}>{getDealScore(p, i + 1)}</td>
                  ))}
                  {Object.keys(roundScores).length > 0 && !isFinished && (
                    <td style={{ textAlign: 'center', color: roundScores[p.id] === 0 ? '#27ae60' : 'inherit' }}>
                      {roundScores[p.id] ?? '-'}
                    </td>
                  )}
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{getScore(p)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 20 }}>
          {isFinished ? (
            <>
              {isHost && <button className="btn-primary" onClick={onPlayAgain}>Play Again</button>}
              <button className="btn-secondary" onClick={onLeave}>Leave</button>
            </>
          ) : (
            <>
              {isHost && (
                <button className="btn-primary" onClick={onNextDeal}>
                  Continue to Next Deal →
                </button>
              )}
              {!isHost && (
                <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                  ⏳ Waiting for host to continue...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
