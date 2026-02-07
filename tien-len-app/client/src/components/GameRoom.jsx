import React, { useEffect, useState } from 'react';
import socket from '../services/socket';
import Card from './Card';

const GameRoom = ({ roomId, initialPlayers }) => {
    const [players, setPlayers] = useState(initialPlayers);
    const [hand, setHand] = useState([]);
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [lastPlay, setLastPlay] = useState(null);
    const [turnIndex, setTurnIndex] = useState(-1);
    const [gameStatus, setGameStatus] = useState('WAITING');
    const [message, setMessage] = useState('');
    const [winner, setWinner] = useState(null);
    const [finishedPlayers, setFinishedPlayers] = useState([]); // Array of { playerId, rank }

    // Chat State
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    // Force update for socket.id
    const [, forceUpdate] = useState();

    useEffect(() => {
        // Ensure we re-render when socket connects to get ID
        if (!socket.id) {
            const onConnect = () => forceUpdate({});
            socket.on('connect', onConnect);
            return () => socket.off('connect', onConnect);
        }
    }, []);

    useEffect(() => {
        console.log("GameRoom mounted for Room:", roomId);

        socket.on('update_players', (data) => {
            console.log("Received update_players:", data);
            setPlayers(data.players);
        });

        socket.on('game_started', (data) => {
            setHand(data.hand);
            setTurnIndex(data.turnIndex);
            setGameStatus('PLAYING');
            setPlayers(data.players);
            setPlayers(data.players);
            setLastPlay(null);
            setFinishedPlayers([]);
            setWinner(null);
            setMessage("ចាប់ផ្តើមលេង! (Game Started)");
        });

        socket.on('turn_update', (data) => {
            setTurnIndex(data.turnIndex);

            if (data.isNewRound) {
                setMessage("ចប់មួយជុំ! (Round Finished)");
                // Delay clearing the board so users see the winning play
                setTimeout(() => {
                    setLastPlay(null);
                    setMessage("ចូលជុំថ្មី! (New Round)");
                }, 2000);
            } else {
                if (data.lastPlay) setLastPlay(data.lastPlay);
            }
        });

        socket.on('player_action', (data) => {
            if (data.type === 'PASS') {
                setMessage(`អ្នកលេងបាន Pass`);
            } else if (data.type === 'PLAY') {
                setLastPlay({ cards: data.cards, playerId: data.playerId });

                if (data.playerId === socket.id) {
                    const playedCards = data.cards;
                    setHand(currentHand => currentHand.filter(c =>
                        !playedCards.some(pc => pc.rank === c.rank && pc.suit === c.suit)
                    ));
                    setSelectedIndices([]);
                }
            }
        });

        socket.on('player_finished', (data) => {
            setFinishedPlayers(prev => [...prev, data]);
            setMessage(prev => `${prev ? prev + ' ' : ''}Player Finished Rank #${data.rank}!`);
        });

        socket.on('game_over', (data) => {
            setGameStatus('FINISHED');
            setWinner(data.winnerId);
            setFinishedPlayers(data.finishedPlayers.map((id, index) => ({ playerId: id, rank: index + 1 })));
            setMessage("Game Over!");
        });

        socket.on('receive_message', (data) => {
            setChatMessages(prev => [...prev, data]);
        });

        socket.on('error', (data) => setMessage(data.message));

        socket.on('game_reset', (data) => {
            setPlayers(data.players);
            setHand([]);
            setGameStatus('WAITING');
            setWinner(null);
            setFinishedPlayers([]);
            setLastPlay(null);
            setMessage("បានចាប់ផ្តើមហ្គេមថ្មី! (Game Reset)");
        });

        return () => {
            socket.off('update_players');
            socket.off('game_started');
            socket.off('turn_update');
            socket.off('player_action');
            socket.off('player_finished');
            socket.off('game_over');
            socket.off('receive_message');
            socket.off('game_reset');
            socket.off('error');
        };
    }, []);

    const resetGame = () => {
        if (window.confirm("តើអ្នកច្បាស់ទេថាចង់ចាប់ផ្តើមហ្គេមថ្មី? (Restart Game?)")) {
            socket.emit('reset_game', { roomId });
        }
    };

    const toggleSelect = (index) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            setSelectedIndices([...selectedIndices, index]);
        }
    };

    const playCards = () => {
        if (selectedIndices.length === 0) return;
        const cards = selectedIndices.map(i => hand[i]);
        socket.emit('play_cards', { roomId, cards });
    };

    const passTurn = () => {
        socket.emit('pass_turn', { roomId });
    };

    const sendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const myName = players.find(p => p.id === socket.id)?.name || 'Me';
        socket.emit('send_message', { roomId, sender: myName, text: chatInput });
        setChatInput('');
    };

    const startGame = () => {
        socket.emit('start_game', roomId);
    };

    const getRelativePlayers = () => {
        if (!socket.id) {
            // Fallback: just return everyone else if I don't know who I am
            // Or return empty to be safe
            return players.filter(p => p.id !== 'unknown');
        }
        const myIndex = players.findIndex(p => p.id === socket.id);
        if (myIndex === -1) return players; // Should not happen

        const others = [];
        const count = players.length;
        for (let i = 1; i < count; i++) {
            const idx = (myIndex + i) % count;
            others.push(players[idx]);
        }
        return others;
    };

    const others = getRelativePlayers();
    const myPlayer = players.find(p => p.id === socket.id);
    const isMyTurn = players[turnIndex]?.id === socket.id;

    console.log("Render GameRoom. Players:", players.length, "SocketID:", socket.id);

    return (
        <div className="game-container">
            {/* Room Info Header */}
            <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                padding: '15px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                zIndex: 100,
                textAlign: 'left',
                minWidth: '200px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 10px #2ecc71' }}></div>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Room: {roomId}</h3>
                </div>
                <p style={{ margin: '5px 0 0 20px', fontSize: 12, opacity: 0.8 }}>Share code with friends!</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingLeft: 20 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 'bold' }}>Players: {players.length}/4</p>
                    <button
                        onClick={resetGame}
                        style={{
                            marginLeft: 10,
                            padding: '6px 12px',
                            fontSize: 11,
                            background: 'rgba(231, 76, 60, 0.2)',
                            color: '#e74c3c',
                            border: '1px solid #e74c3c',
                            borderRadius: 6,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#e74c3c'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)'; e.currentTarget.style.color = '#e74c3c'; }}
                    >
                        New Game
                    </button>
                </div>
            </div>

            {/* Center Messages / Start Button */}
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                zIndex: 90,
                pointerEvents: 'none' // Click through to cards if playing
            }}>
                {message && <div style={{ background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: 8, marginBottom: 10, display: 'inline-block' }}>{message}</div>}

                {gameStatus === 'WAITING' && (
                    <div style={{
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(10px)',
                        padding: 40,
                        borderRadius: 24,
                        pointerEvents: 'auto',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        minWidth: 300
                    }}>
                        <h2 style={{ marginTop: 0 }}>Waiting for players...</h2>
                        <div style={{ marginBottom: 20 }}>
                            {players.map(p => (
                                <div key={p.id} style={{ padding: 5 }}>{p.name} {p.id === socket.id ? '(You)' : ''}</div>
                            ))}
                        </div>
                        {players.length < 2 ? (
                            <p style={{ color: '#cbd5e0' }}>រង់ចាំអ្នកលេងយ៉ាងតិច ១ នាក់ទៀត...</p>
                        ) : (
                            <button className="btn btn-success" onClick={startGame}>ចាប់ផ្តើម</button>
                        )}
                    </div>
                )}

                {winner && (
                    <div style={{
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)',
                        padding: 30,
                        borderRadius: 24,
                        border: '2px solid gold',
                        minWidth: 300,
                        boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)'
                    }}>
                        <h2 style={{ color: 'gold' }}>ចប់ការប្រកួត! (Game Over)</h2>
                        <div style={{ textAlign: 'left' }}>
                            {finishedPlayers.map((fp) => {
                                const p = players.find(x => x.id === fp.playerId);
                                return (
                                    <div key={fp.playerId} style={{ fontSize: 20, margin: '10px 0', color: fp.playerId === socket.id ? '#48bb78' : 'white' }}>
                                        #{fp.rank}: {p ? p.name : 'Unknown'} {fp.playerId === socket.id ? '(You)' : ''}
                                    </div>
                                );
                            })}
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={startGame}>លេងម្តងទៀត (Play Again)</button>
                    </div>
                )}

                {isMyTurn && <div style={{ color: 'yellow', fontWeight: 'bold', fontSize: 24, textShadow: '0 0 10px black', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: 20, display: 'inline-block' }}>YOUR TURN</div>}
            </div>

            {/* Opponents */}
            {others.map((p, i) => {
                let posClass = 'player-top';
                if (others.length === 1) posClass = 'player-top';
                else if (others.length === 2) posClass = i === 0 ? 'player-left' : 'player-right';
                else if (others.length === 3) posClass = i === 0 ? 'player-left' : i === 1 ? 'player-top' : 'player-right';

                const isTurn = players[turnIndex]?.id === p.id;
                const isFinished = finishedPlayers.find(fp => fp.playerId === p.id);

                return (
                    <div key={p.id} className={`other-player ${posClass}`}>
                        <div className={`avatar ${isTurn ? 'turn-active' : ''}`} style={{ borderColor: isTurn ? '#48bb78' : isFinished ? 'gold' : 'white' }}>
                            {isFinished ? (
                                <span style={{ color: 'gold', fontWeight: 'bold' }}>#{isFinished.rank}</span>
                            ) : (
                                p.name.charAt(0)
                            )}
                            {isTurn && !isFinished && <div className="turn-indicator"></div>}
                        </div>
                        <div className="player-info">{p.name} | Cards: {p.handCount !== undefined ? p.handCount : (p.hand ? p.hand.length : 0)}</div>
                        {p.passed && !isFinished && <div style={{ color: 'red', fontSize: 10, background: 'rgba(0,0,0,0.5)', padding: '0 4px', borderRadius: 2 }}>PASSED</div>}
                    </div>
                );
            })}

            {/* Play Area */}
            <div className="play-area">
                {lastPlay && lastPlay.cards.map((c, i) => (
                    <Card key={i} card={c} isSelected={false} onClick={() => { }} />
                ))}
            </div>

            {/* My Hand */}
            <div className="my-hand">
                {gameStatus === 'WAITING' ? null : (
                    /* Only show controls if not waiting */
                    <div className="controls">
                        {isMyTurn && (
                            <>
                                <button className="btn btn-success" onClick={playCards} disabled={selectedIndices.length === 0}>ចាក់ (Play)</button>
                                <button className="btn btn-danger" onClick={passTurn}>ផាស (Pass)</button>
                            </>
                        )}
                        <button className="btn btn-secondary" onClick={() => setHand([...hand].sort((a, b) => (a.rank * 10 + a.suit) - (b.rank * 10 + b.suit)))}>រៀបបៀ (Sort)</button>
                    </div>
                )}

                <div className="hand-container">
                    {hand.map((c, i) => (
                        <Card
                            key={i}
                            card={c}
                            isSelected={selectedIndices.includes(i)}
                            onClick={() => toggleSelect(i)}
                        />
                    ))}
                </div>

                {myPlayer && myPlayer.passed && !finishedPlayers.find(fp => fp.playerId === socket.id) && <div style={{ color: '#fc8181', textAlign: 'center', marginTop: 10, fontWeight: 'bold', fontSize: 18, textShadow: '0 0 5px black' }}>YOU PASSED</div>}
                {finishedPlayers.find(fp => fp.playerId === socket.id) && <div style={{ color: 'gold', textAlign: 'center', marginTop: 10, fontWeight: 'bold', fontSize: 24, textShadow: '0 0 5px black' }}>YOU FINISHED #{finishedPlayers.find(fp => fp.playerId === socket.id).rank}!</div>}
            </div>

            {/* Chat */}
            <div className="chat-container">
                <div className="chat-messages">
                    {chatMessages.map((msg, i) => (
                        <div key={i}>
                            <strong style={{ color: msg.sender === (myPlayer?.name || 'Me') ? '#63b3ed' : '#f687b3' }}>{msg.sender}:</strong> {msg.text}
                        </div>
                    ))}
                </div>
                <form className="chat-input-area" onSubmit={sendChat}>
                    <input
                        className="chat-input"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                    />
                </form>
            </div>
        </div>
    );
};

export default GameRoom;
