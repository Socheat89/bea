const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Game = require('./src/models/Game');
const { getCardValue } = require('./src/utils/cardLogic');

const app = express();
app.use(cors());

// Serve static files from the React app
const path = require('path');
// Since client is sibling, we might need adjustments in deployment.
// For now, assume client build is in client/dist
// Or we copy dist to server/public
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow all for dev
        methods: ["GET", "POST"]
    }
});

const games = {}; // roomId -> Game instance

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create Room
    socket.on('create_room', (data) => {
        const roomId = uuidv4().substring(0, 6).toUpperCase(); // Short code
        const game = new Game(roomId);
        games[roomId] = game;

        const player = { id: socket.id, name: data.username || 'Player' };
        game.addPlayer(player);

        socket.join(roomId);
        socket.emit('room_created', { roomId, players: game.players });
        console.log(`Room ${roomId} created by ${player.name}`);
    });

    // Join Room
    socket.on('join_room', (data) => {
        const { roomId, username } = data;
        const game = games[roomId];

        if (!game) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        if (game.status !== 'WAITING') {
            socket.emit('error', { message: 'Game already started' });
            return;
        }

        const player = { id: socket.id, name: username || 'Guest' };
        if (game.addPlayer(player)) {
            socket.join(roomId);
            io.to(roomId).emit('update_players', { players: game.players });
            socket.emit('joined_room', { roomId, players: game.players });
            console.log(`${username} joined room ${roomId}`);
        } else {
            socket.emit('error', { message: 'Room full' });
        }
    });

    // Start Game
    socket.on('start_game', (roomId) => {
        const game = games[roomId];
        if (game && game.players.length >= 2) { // Allow 2+ for testing
            if (game.players[0].id === socket.id) { // Only host starts? Simply first player is host
                game.startGame();

                // Deal cards to specific sockets
                // We cannot send everyone's hands to everyone.
                game.players.forEach(p => {
                    io.to(p.id).emit('game_started', {
                        hand: p.hand,
                        turnIndex: game.currentTurnIndex,
                        players: game.players.map(pl => ({
                            ...pl,
                            handCount: pl.hand.length,
                            hand: [] // Hide other hands
                        })),
                        lastPlay: null
                    });
                });

                io.to(roomId).emit('turn_update', {
                    turnIndex: game.currentTurnIndex,
                    lastPlay: null
                });
            }
        }
    });

    // Play Cards
    socket.on('play_cards', (data) => {
        const { roomId, cards } = data;
        const game = games[roomId];
        if (!game) return;

        // Verify valid logic
        // Need to reconstruct card objects if simplified data sent
        // Assuming client sends full card objects {rank, suit}

        const result = game.playTurn(socket.id, cards);
        if (result.valid) {
            // Update all clients
            io.to(roomId).emit('player_action', {
                type: 'PLAY',
                playerId: socket.id,
                cards: cards,
                remainingCards: game.players.find(p => p.id === socket.id).hand.length
            });

            if (result.gameOver) {
                io.to(roomId).emit('game_over', { winnerId: socket.id });
                game.status = 'FINISHED';
            } else {
                io.to(roomId).emit('turn_update', {
                    turnIndex: game.currentTurnIndex,
                    lastPlay: game.lastPlay
                });
            }
        } else {
            socket.emit('error', { message: result.message });
        }
    });

    // Pass Turn
    socket.on('pass_turn', (data) => {
        const { roomId } = data;
        const game = games[roomId];
        if (!game) return;

        const result = game.passTurn(socket.id);
        if (result.valid) {
            io.to(roomId).emit('player_action', {
                type: 'PASS',
                playerId: socket.id
            });

            // Check if round reset (new round) happened inside passTurn logic
            // The Game logic handles currentTurnIndex update.
            // If new round, lastPlay becomes null.

            io.to(roomId).emit('turn_update', {
                turnIndex: game.currentTurnIndex,
                lastPlay: game.lastPlay,
                isNewRound: !game.lastPlay
            });
        } else {
            socket.emit('error', { message: result.message });
        }
    });

    // Chat
    socket.on('send_message', (data) => {
        io.to(data.roomId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle disconnect: remove player or mark offline?
        // Simple: remove from waiting games
        for (const roomId in games) {
            const game = games[roomId];
            const pIndex = game.players.findIndex(p => p.id === socket.id);
            if (pIndex !== -1) {
                game.removePlayer(socket.id);
                io.to(roomId).emit('update_players', { players: game.players });
                if (game.players.length === 0) {
                    delete games[roomId];
                }
                break;
            }
        }
    });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
