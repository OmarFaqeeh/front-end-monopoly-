// REST client for the game server. No Supabase access from the browser: everything goes through the backend.
export const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? (process.env.NODE_ENV === "production" ? "https://back-end-monopoly-yaki.vercel.app" : "http://localhost:4000")).replace(/\/+$/, "");

/** Language-agnostic error from the server (or NETWORK_ERROR when it cannot be reached). */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status = 0,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new ApiError("NETWORK_ERROR");
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(body.error ?? "INTERNAL", res.status);
  return body as T;
}

export interface CreatedRoom {
  code: string;
  playerId: string;
  playerToken: string;
  expiresAt: number;
  serverNow: number;
}

export interface RoomLookup {
  code: string;
  status: "waiting" | "playing" | "closed";
  playerCount: number;
  maxPlayers: number;
  joinable: boolean;
  reason?: string;
}

export const createRoom = (nickname: string) => request<CreatedRoom>("/api/rooms", { method: "POST", body: JSON.stringify({ nickname }) });
export const lookupRoom = (code: string) => request<RoomLookup>(`/api/rooms/${encodeURIComponent(code)}`);
