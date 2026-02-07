import React, { useState } from 'react';
import socket from '../services/socket';

const Lobby = ({ onJoin }) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [error, setError] = useState('');

    const handleCreate = () => {
        if (!username) { setError('Name is required'); return; }
        socket.connect();
        socket.emit('create_room', { username });
    };

    const handleJoin = () => {
        if (!username || !roomId) { setError('Name and Room ID required'); return; }
        socket.connect();
        socket.emit('join_room', { username, roomId: roomId.toUpperCase() });
    };

    return (
        <div className="lobby-container">
            <h1>Tiến Lên Connect</h1>
            <input
                className="lobby-input"
                placeholder="Enter your name"
                value={username}
                onChange={e => setUsername(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn" onClick={handleCreate}>Create Room</button>
            </div>
            <div>OR</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <input
                    className="lobby-input"
                    placeholder="Room Code"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={handleJoin}>Join</button>
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

export default Lobby;
