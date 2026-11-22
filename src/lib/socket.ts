// Socket.IO client singleton (uses NEXT_PUBLIC_BACKEND_URL). Connects only when a room page asks for it.
import { io, type Socket } from "socket.io-client";
import { BACKEND_URL } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  socket ??= io(BACKEND_URL, { autoConnect: false, transports: ["websocket"], reconnectionDelayMax: 4000 });
  return socket;
}

export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

/** Emits an event and resolves with the server's ack (rejects after a timeout). */
export function emitAck<T>(event: string, payload?: unknown, timeoutMs = 8000): Promise<T> {
  const s = getSocket();
  return new Promise<T>((resolve, reject) => {
    s.timeout(timeoutMs).emit(event, payload, (err: Error | null, response: T) => (err ? reject(err) : resolve(response)));
  });
}
