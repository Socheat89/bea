# Tiến Lên Connect - Implementation Plan

## 1. Architecture Overview
A real-time multiplayer card game web application.
- **Frontend**: React (Vite) for UI, Socket.io-client for real-time communication.
- **Backend**: Node.js (Express) + Socket.io for game server.
- **Database**: 
  - *Active Games*: In-memory storage (high performance).
  - *Users/History*: JSON-based persistence (simple, portable for demo) or SQLite.

## 2. Directory Structure
```
/
├── client/         # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/  # GameBoard, Card, Hand, Lobby, Chat
│   │   ├── services/    # Socket service, API
│   │   ├── utils/       # Game logic helpers (card sorting, validation)
│   │   └── App.jsx
│   └── index.css   # Global styles & variables
├── server/         # Node.js Backend
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── models/      # GameState, Player, Room
│   │   ├── socket/      # Socket event handlers
│   │   └── utils/       # Deck generation, rule validation
│   └── index.js    # Entry point
└── README.md
```

## 3. Key Features Implementation

### Phase 1: Foundation & Backend Core
- **Server Setup**: Express + Socket.io.
- **Game Logic (Backend)**:
  - `Deck` class: Shuffle, deal.
  - `Card` logic: Rank comparison (3 < ... < 2), Suit comparison (Spade < Club < Diamond < Heart).
  - `Turn` validation: Check if a play beats the previous play.
  - `Room` management: Create/Join via code.

### Phase 2: Frontend Core
- **Lobby UI**: Login (mocked/simple), Room creation/joining.
- **Game Room UI**:
  - Display other players (avatars, card counts).
  - Display current player's hand.
  - Action buttons: "Play", "Pass", "Sort".
  - Game log/Chat area.

### Phase 3: Real-time Gameplay
- **Socket Events**:
  - `join_room`, `leave_room`
  - `game_start`, `deal_cards`
  - `play_cards`, `pass_turn`
  - `game_over`
- **Synchronization**: Broadcast game state updates after every valid move.

### Phase 4: Polish & Advanced Features
- **UI/UX**: Smooth card animations (CSS transitions), Sound effects.
- **Chat**: Text chat integration.
- **Voice**: WebRTC integration (peer-to-peer or via simple audio stream).

## 4. Technical Stack
- **Languages**: JavaScript/TypeScript.
- **Styles**: Vanilla CSS (CSS Modules or standard CSS).
- **Icons**: Lucide-React or similar.
