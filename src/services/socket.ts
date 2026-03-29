import { io, Socket } from "socket.io-client";

const API_BASE = import.meta.env.PROD 
  ? 'https://sportbuzz-backend.onrender.com' 
  : 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket || !socket.connected) {
    // Clean up old dead socket if it exists
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    
    const token = localStorage.getItem("token");
    console.log("[SOCKET] Connecting to:", API_BASE, "token:", token ? "present" : "missing");
    
    socket = io(API_BASE, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      auth: {
        token: token
      }
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("[SOCKET] Connection error:", err.message);
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
