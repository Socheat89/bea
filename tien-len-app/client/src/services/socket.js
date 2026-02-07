import { io } from 'socket.io-client';

const isDev = import.meta.env.MODE === 'development';

// In production (Render), backend serves frontend, so we use the same origin (no specific port).
// In development, we need to point to port 3001.
const URL = isDev
    ? `http://${window.location.hostname}:3001`
    : undefined; // undefined lets Socket.io connect to the same origin automatically

console.log("Initializing socket connection. Environment:", isDev ? "Development" : "Production");

const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling']
});

socket.on('connect_error', (err) => {
    console.error("Socket Connection Error:", err);
});

export default socket;
