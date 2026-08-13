import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

export const socketEnabled = Boolean(SOCKET_URL);

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  if (!SOCKET_URL) return null;
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, { withCredentials: true });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
