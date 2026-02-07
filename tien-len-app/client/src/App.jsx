import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import socket from './services/socket';
import './index.css';


function App() {
  console.log("App Component Rendering...");
  const [inGame, setInGame] = useState(false);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    socket.on('room_created', (data) => {
      console.log('Room Created Event:', data);
      if (data && data.roomId && data.players) {
        setGameData(data);
        setInGame(true);
      } else {
        console.error("Invalid room data received:", data);
      }
    });

    socket.on('joined_room', (data) => {
      console.log('Joined Room Event:', data);
      if (data && data.roomId && data.players) {
        setGameData(data);
        setInGame(true);
      } else {
        console.error("Invalid room data received:", data);
      }
    });

    return () => {
      socket.off('room_created');
      socket.off('joined_room');
    };
  }, []);

  if (inGame && !gameData) {
    // Should not happen, but safe fallback
    return <div style={{ color: 'red' }}>Error: Game state mismatch. Please refresh.</div>;
  }

  return (
    <div className="app-container">
      {inGame ? (
        <GameRoom roomId={gameData.roomId} initialPlayers={gameData.players} />
      ) : (
        <Lobby />
      )}
    </div>
  );
}

export default App;
