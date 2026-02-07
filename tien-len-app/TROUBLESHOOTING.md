
# Tien Len App - Troubleshooting

## Blank Screen Issue?
I have added error catching to the application. If you see a red or orange box with an error message, please read it.

## Steps to Restart Completely
If things are still not working:

1. **Stop all servers**:
   In your terminal, press `Ctrl+C` multiple times to stop running processes.
   Or run: `taskkill /F /IM node.exe` (Windows)

2. **Start Server**:
   ```bash
   cd server
   node index.js
   ```
   Should see: `Server running on port 3001`

3. **Start Client** (Open new terminal):
   ```bash
   cd client
   npm run dev
   ```
   Should see: `Local: http://localhost:5173/`

4. **Open Browser**:
   Go to `http://localhost:5173`

## Features
- Create/Join Rooms
- Chat
- Real-time card game
