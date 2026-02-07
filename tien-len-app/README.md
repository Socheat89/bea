# Tiến Lên Connect

A real-time multiplayer implementation of the Vietnamese card game "Tiến Lên" (Killer 13).

## Features
- **Real-time Gameplay**: Powered by Socket.io.
- **Lobby System**: Create and join private rooms.
- **Game Rules**:
  - Auto-dealing and sorting.
  - Turn-based logic.
  - Combination validation (Pairs, Triples, Quads, Sequences).
  - "Cut" logic (Pine/Quad beats 2).
- **Responsive UI**: Works on desktop and mobile.

## Prerequisites
- Node.js (v14+)
- npm

## Installation

1. **Install Dependencies**
   ```bash
   # Server
   cd server
   npm install

   # Client
   cd ../client
   npm install
   ```

## Running the Application

1. **Start the Backend Server**
   ```bash
   cd server
   node index.js
   ```
   Server runs on http://localhost:3001

2. **Start the Frontend Client**
   ```bash
   cd client
   npm run dev
   ```
   Client runs on http://localhost:5173

3. **Play!**
   - Open multiple browser tabs to http://localhost:5173.
   - Enter a name and click "Create Room" in one tab.
   - Copy the Room ID.
   - In other tabs, enter a name, paste the Room ID, and click "Joined".
   - Start the game when at least 2 players are present.

## Project Structure
- `client/`: React + Vite frontend.
- `server/`: Node.js + Express + Socket.io backend.
- `server/src/models/Game.js`: Core game state and logic.
- `server/src/utils/cardLogic.js`: Card combination and comparison rules.

## Tech Stack
- Frontend: React, Vite, CSS (Vanilla)
- Backend: Node.js, Express, Socket.io
