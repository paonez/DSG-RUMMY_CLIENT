import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import GameTable from './components/GameTable';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function App() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [screen, setScreen] = useState('lobby'); // lobby | waiting | game
  const [roomState, setRoomState] = useState(null);
  const [myId, setMyId] = useState(null);
  const [error, setError] = useState(null);
  const [myName, setMyName] = useState('');
  const [myCode, setMyCode] = useState('');

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setMyId(socket.id);
      // Try reconnect
      const savedCode = sessionStorage.getItem('dsg_room_code');
      const savedName = sessionStorage.getItem('dsg_player_name');
      if (savedCode && savedName) {
        socket.emit('reconnectRoom', { code: savedCode, name: savedName });
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('roomCreated', ({ code }) => {
      setMyCode(code);
      sessionStorage.setItem('dsg_room_code', code);
    });

    socket.on('roomJoined', ({ code }) => {
      setMyCode(code);
      sessionStorage.setItem('dsg_room_code', code);
      setScreen('waiting');
    });

    socket.on('stateUpdate', (state) => {
      setRoomState(state);
      if (state.status === 'playing' || state.status === 'finished') setScreen('game');
      else if (state.status === 'lobby') setScreen('waiting');
    });

    socket.on('declarationMade', ({ playerId, result }) => {
      // Handled via stateUpdate
    });

    socket.on('playerDropped', ({ playerId, penalty }) => {
      // Shown via stateUpdate
    });

    socket.on('chatMessage', ({ name, message, ts }) => {
      // bubble up to game table
      window._dsgChatMsg = { name, message, ts };
      window.dispatchEvent(new CustomEvent('dsg_chat', { detail: { name, message, ts } }));
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    return () => socket.disconnect();
  }, []);

  function emit(event, data) {
    socketRef.current?.emit(event, data);
  }

  function handleCreateRoom({ name, variant, maxPlayers, totalDeals }) {
    setMyName(name);
    sessionStorage.setItem('dsg_player_name', name);
    emit('createRoom', { name, variant, maxPlayers, totalDeals });
    setScreen('waiting');
  }

  function handleJoinRoom({ name, code }) {
    setMyName(name);
    sessionStorage.setItem('dsg_player_name', name);
    emit('joinRoom', { name, code });
  }

  function handleStart() {
    emit('startGame', { code: myCode });
  }

  function handleLeave() {
    sessionStorage.removeItem('dsg_room_code');
    sessionStorage.removeItem('dsg_player_name');
    setScreen('lobby');
    setRoomState(null);
    setMyCode('');
  }

  // Use socket.id as myId, but refresh after reconnect
  const effectiveMyId = socketRef.current?.id || myId;

  return (
    <div>
      {/* Connection banner */}
      {!connected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#c0392b', color: '#fff', textAlign: 'center',
          padding: '8px', fontSize: 13, fontWeight: 500,
        }}>
          ⚡ Reconnecting to server...
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="toast" style={{ background: '#c0392b', borderColor: '#e74c3c' }}>
          ❌ {error}
        </div>
      )}

      {screen === 'lobby' && (
        <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      )}

      {screen === 'waiting' && roomState && (
        <WaitingRoom
          state={roomState}
          myId={effectiveMyId}
          onStart={handleStart}
          onLeave={handleLeave}
        />
      )}

      {screen === 'game' && roomState && (
        <GameTable
          state={roomState}
          myId={effectiveMyId}
          emit={emit}
        />
      )}
    </div>
  );
}
