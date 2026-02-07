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
        this.winner = null;
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

        // Reset pass status for all? 
        // No, in Tien Len, if you play, previous passers are still passed until round ends.

        // Check win
        if (player.hand.length === 0) {
            this.status = 'FINISHED';
            this.winner = playerId;
            return { valid: true, gameOver: true };
        }

        this.nextTurn();
        return { valid: true, gameOver: false };
    }

    passTurn(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== this.currentTurnIndex) return { valid: false, message: "Not your turn" };

        if (!this.lastPlay) return { valid: false, message: "Cannot pass on free turn" };

        this.players[playerIndex].passed = true;
        this.nextTurn();
        return { valid: true };
    }

    nextTurn() {
        // Find next player who hasn't passed
        let nextIndex = (this.currentTurnIndex + 1) % this.players.length;
        let attempts = 0;

        // While next player has passed or (variant: finished?), keep skipping
        // In Tien Len, once you pass, you are out of the round (until everyone passes).
        // If everyone passes except one, that one gets a free turn (new round).

        // Check if round ended (all other active players passed)
        // Active players = players with cards.

        const activePlayers = this.players.filter(p => p.hand.length > 0);
        // Note: players with 0 cards might still be in game technically if considering 2nd/3rd place, 
        // but typically game ends immediately or continues for rank. 
        // MVP: End on first winner.

        // Count how many active players passed (in this round)
        // If all other active players passed, then current `lastPlay.playerId` wins the round.
        // Wait, `lastPlay.playerId` is the one who played the beatable cards.

        // If everyone else passed after me, I start new round.
        // We need to check if the `nextIndex` is the `lastPlay.playerId`.
        // If we circle back to the person who made the last play, and everyone else passed, they win the round.

        // Let's loop until we find a non-passed player.
        // If we loop back to `lastPlay.playerId` (and they are still in game), they get free turn.

        if (!this.lastPlay) {
            // Should not happen here if passTurn logic correct, but if new game...
            this.currentTurnIndex = nextIndex; // Simple rotate
            return;
        }

        let loopCount = 0;
        while (this.players[nextIndex].passed || this.players[nextIndex].hand.length === 0) {
            nextIndex = (nextIndex + 1) % this.players.length;
            loopCount++;
            if (loopCount > this.players.length) break; // Should not happen
        }

        const lastPlayerId = this.lastPlay.playerId;

        // If only one player left who hasn't passed?
        // Logic: if `nextIndex` corresponds to `lastPlayerId`, user wins round.
        if (this.players[nextIndex].id === lastPlayerId) {
            // Round finished.
            // Reset passes.
            this.players.forEach(p => p.passed = false);
            this.lastPlay = null;
            this.currentTurnIndex = nextIndex; // Winner starts new round
        } else {
            this.currentTurnIndex = nextIndex;
        }
    }
}

module.exports = Game;
