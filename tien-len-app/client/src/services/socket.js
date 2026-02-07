import { io } from 'socket.io-client';

// Robust URL determination
const hostname = window.location.hostname;
const port = 3001;
const URL = `http://${hostname}:${port}`;

console.log("Initializing socket connection to:", URL);

const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling']
});

socket.on('connect_error', (err) => {
    console.error("Socket Connection Error:", err);
});

export default socket;
