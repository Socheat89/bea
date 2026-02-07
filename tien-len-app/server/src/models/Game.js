const { v4: uuidv4 } = require('uuid');
const { getCombinationType, canBeat, getCardValue, sortCards } = require('../utils/cardLogic');

// Standard 52-card deck
const createDeck = () => {
    const ranks = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // 3-2
    const suits = [0, 1, 2, 3]; // S, C, D, H
    let deck = [];
    for (let r of ranks) {
        for (let s of suits) {
            deck.push({ rank: r, suit: s });
        }
    }
    return deck;
};

const shuffle = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

class Game {
    constructor(roomId) {
        this.id = roomId;
        this.players = []; // { id, name, hand: [], score: 0, passed: false }
        this.status = 'WAITING'; // WAITING, PLAYING, FINISHED
        this.deck = [];
        this.currentTurnIndex = 0;
        this.lastPlay = null; // { cards: [], playerId: '...' }
        this.roundHistory = [];
        this.roundHistory = [];
        this.winner = null;
        this.finishedPlayers = []; // List of player IDs in order of finish
    }

    addPlayer(player) {
        if (this.players.length >= 4) return false;
        this.players.push({
            ...player,
            hand: [],
            score: 0,
            passed: false,
            ready: false
        });
        return true;
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        if (this.players.length < 2) {
            this.status = 'WAITING';
            this.lastPlay = null;
        }
    }

    startGame() {
        if (this.players.length < 2) return false;
        this.deck = shuffle(createDeck());
        this.status = 'PLAYING';
        this.lastPlay = null;
        this.finishedPlayers = [];
        this.players.forEach(p => {
            p.hand = [];
            p.passed = false;
        });

        // Deal 13 cards to each player
        // For < 4 players, some cards remain undealt, standard rules vary.
        // Usually remove random cards or just deal all? 
        // Standard Tien Len deals 13 cards to 4 players. If 2 or 3 players, deal 13 to each, rest removed.
        for (let i = 0; i < 13; i++) {
            this.players.forEach(p => {
                if (this.deck.length > 0) p.hand.push(this.deck.pop());
            });
        }

        // Sort hands
        this.players.forEach(p => p.hand = sortCards(p.hand));

        // Determine starting player: Holds 3 of Spades (lowest card)
        // In first game, player with 3 Spades starts.
        // In subsequent games, winner of previous game starts.
        // For simplicity: Player with lowest card starts first game.
        let starterIndex = -1;
        let lowestCardVal = 9999;

        // Find global lowest card held by anyone
        // Actually, just find who has 3 Spade (Rank 3, Suit 0 => Val 30)
        // If not 4 players, might not be dealt. Then lowest card dealt starts.
        this.players.forEach((p, index) => {
            if (p.hand.length > 0) {
                const lowest = p.hand[0]; // Already sorted
                const val = getCardValue(lowest);
                if (val < lowestCardVal) {
                    lowestCardVal = val;
                    starterIndex = index;
                }
            }
        });

        this.currentTurnIndex = starterIndex;
        return true;
    }

    resetGame() {
        this.status = 'WAITING';
        this.deck = [];
        this.currentTurnIndex = 0;
        this.lastPlay = null;
        this.roundHistory = [];
        this.winner = null;
        this.finishedPlayers = [];
        this.players.forEach(p => {
            p.hand = [];
            p.score = 0;
            p.passed = false;
            p.ready = false;
            delete p.finishedRank;
        });
    }

    playTurn(playerId, cards) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== this.currentTurnIndex) return { valid: false, message: "Not your turn" };

        const player = this.players[playerIndex];

        // Validate player has cards
        // Check if `cards` are in `player.hand`
        // Simplified check: rank/suit match
        // Need to remove played cards from hand if valid.

        // Logic to validate move
        // 1. Validate combo type
        const combo = getCombinationType(cards);
        if (!combo) return { valid: false, message: "Invalid combination" };

        // 2. Validate against lastPlay (if exists)
        if (this.lastPlay) {
            // If everyone else passed, new round starts (lastPlay cleared usually before this call if pass logic handled correctly)
            // But if current turn logic handles round reset, then lastPlay might be null.

            // Check if beats lastPlay
            // We need helper to convert lastPlay.cards to combo object again or store it.
            // Helper `canBeat(prevCards, newCards)` does re-parsing.
            if (!canBeat(this.lastPlay.cards, cards)) {
                return { valid: false, message: "Move does not beat previous play" };
            }
        } else {
            // Start of rule: specific rule for first turn?
            // Must play lowest card? (Optional rule: 3 Spades must be played in first turn)
            // We'll enforce simple rule: any valid combo. 
            // Ideally enforce 3-Spades rule for first ever turn. (Skipping for MVP flexibility)
        }

        // 3. Execute Move
        // Remove cards from hand
        const newHand = player.hand.filter(c =>
            !cards.find(played => played.rank === c.rank && played.suit === c.suit)
        );

        if (newHand.length !== player.hand.length - cards.length) {
            console.error("Card mismatch/cheat attempt?");
            // Better validation needed in production
        }
        player.hand = newHand;

        this.lastPlay = { cards, playerId };
        this.roundHistory.push({ playerId, cards });

        // Check if player exhausted hand
        let justFinished = false;
        if (newHand.length === 0) {
            this.finishedPlayers.push(playerId);
            player.finishedRank = this.finishedPlayers.length; // 1st, 2nd, 3rd...
            justFinished = true;
        }

        // Check Game Over (Only 1 active player left)
        const activeCount = this.players.filter(p => p.hand.length > 0).length;

        if (activeCount <= 1) {
            // If 1 player left, add them as last rank
            const lastPlayer = this.players.find(p => p.hand.length > 0);
            if (lastPlayer) {
                this.finishedPlayers.push(lastPlayer.id);
                lastPlayer.finishedRank = this.finishedPlayers.length;
            }

            this.status = 'FINISHED';
            this.winner = this.finishedPlayers[0]; // First one who finished is winner
            return { valid: true, gameOver: true, finishedPlayers: this.finishedPlayers };
        }

        // If player just finished, they can't continue the round, but their cards serve as the "lastPlay" to beat.
        // The round continues until everyone passes on their cards.

        this.nextTurn();
        return { valid: true, gameOver: false, finished: justFinished, finishedRank: player.finishedRank };
    }

    passTurn(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        const player = this.players[playerIndex];

        if (playerIndex !== this.currentTurnIndex) return { valid: false, message: "Not your turn" };
        if (!this.lastPlay) return { valid: false, message: "Cannot pass on free turn" };

        player.passed = true;
        this.nextTurn();
        return { valid: true };
    }

    nextTurn() {
        // Find next player who hasn't passed AND hasn't finished (empty hand)
        let nextIndex = (this.currentTurnIndex + 1) % this.players.length;
        let controlId = this.lastPlay ? this.lastPlay.playerId : null; // The player who controls the round

        // If the control player finished their hand, who controls the round?
        // Logic: if I finish, my cards are still on table. People must beat them.
        // If everyone passes, the round ends. Who starts next?
        // Standard rule: The person next to the finished player starts the new round.
        // However, standard Tien Len usually says if you finish and everyone passes, 
        // the person to your right (or next active) starts.

        // Loop to find next candidate
        const count = this.players.length;
        let foundNext = false;

        for (let i = 0; i < count; i++) {
            const p = this.players[nextIndex];

            // Check if we wrapped around to the person who holds control
            if (controlId && p.id === controlId) {
                // Round finished! Everyone else passed.
                // Reset passes
                this.players.forEach(pl => pl.passed = false);
                this.lastPlay = null;

                // But wait, the control player might have finished their hand!
                if (p.hand.length === 0) {
                    // If the winner of the round has no cards, 
                    // the lead passes to the next active player after them.
                    let nextActive = nextIndex;
                    for (let j = 0; j < count; j++) {
                        nextActive = (nextActive + 1) % count;
                        if (this.players[nextActive].hand.length > 0) {
                            this.currentTurnIndex = nextActive;
                            return;
                        }
                    }
                } else {
                    // Winner still has cards, they start new round.
                    this.currentTurnIndex = nextIndex;
                    return;
                }
            }

            // Normal check: valid player to take turn?
            // Must have cards and not passed.
            if (p.hand.length > 0 && !p.passed) {
                this.currentTurnIndex = nextIndex;
                foundNext = true;
                break;
            }

            nextIndex = (nextIndex + 1) % count;
        }

        if (!foundNext) {
            // Edge case: should be handled by controlId check usually.
            // If we are here, likely new round start or weird state.
            // Just find first active player.
            for (let i = 0; i < count; i++) {
                nextIndex = (this.currentTurnIndex + 1 + i) % count;
                if (this.players[nextIndex].hand.length > 0) {
                    this.currentTurnIndex = nextIndex;
                    return;
                }
            }
        }
    }
}

module.exports = Game;
