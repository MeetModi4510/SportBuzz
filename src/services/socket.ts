import { io, Socket } from "socket.io-client";

const API_BASE = import.meta.env.PROD 
  ? 'https://sportbuzz-backend.onrender.com' 
  : 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("token");
    socket = io(API_BASE, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket"],
      auth: {
        token: token
      }
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
