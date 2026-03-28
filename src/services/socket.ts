import { io, Socket } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : (import.meta.env.PROD ? '' : 'http://localhost:5000');

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("token");
    socket = io(API_BASE, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
