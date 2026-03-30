import { io, Socket } from "socket.io-client";

const API_BASE = import.meta.env.PROD 
  ? 'https://sportbuzz-backend.onrender.com' 
  : 'http://localhost:5000';

let socket: Socket | null = null;
let isConnecting = false;

export const getSocket = () => {
  if (isConnecting && socket) return socket;

  if (!socket) {
    isConnecting = true;
    const token = localStorage.getItem("token");
    console.log("[SOCKET] Initializing connection to:", API_BASE);
    
    socket = io(API_BASE, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      auth: { token }
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected:", socket?.id);
      isConnecting = false;
    });

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected:", reason);
      isConnecting = false;
    });

    socket.on("connect_error", (err) => {
      console.error("[SOCKET] Connection error:", err.message);
      isConnecting = false;
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
