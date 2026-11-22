// Per-room credentials kept in sessionStorage so a reload or reconnect keeps the same seat.
export interface RoomCredentials {
  playerId: string;
  playerToken: string;
}

const key = (code: string) => `deal-rush:room:${code}`;
const prefillKey = (code: string) => `deal-rush:prefill:${code}`;

export function loadCredentials(code: string): RoomCredentials | null {
  try {
    const raw = window.sessionStorage.getItem(key(code));
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<RoomCredentials>;
    return typeof v.playerId === "string" && typeof v.playerToken === "string" ? { playerId: v.playerId, playerToken: v.playerToken } : null;
  } catch {
    return null;
  }
}

export function saveCredentials(code: string, creds: RoomCredentials): void {
  try {
    window.sessionStorage.setItem(key(code), JSON.stringify(creds));
  } catch {
    /* storage unavailable */
  }
}

export function clearCredentials(code: string): void {
  try {
    window.sessionStorage.removeItem(key(code));
  } catch {
    /* storage unavailable */
  }
}

/** The Play page already asked for the nickname: the room page can join without asking again. */
export function setPrefill(code: string, nickname: string): void {
  try {
    window.sessionStorage.setItem(prefillKey(code), nickname);
  } catch {
    /* storage unavailable */
  }
}

export function getPrefill(code: string): string | null {
  try {
    return window.sessionStorage.getItem(prefillKey(code));
  } catch {
    return null;
  }
}

export function clearPrefill(code: string): void {
  try {
    window.sessionStorage.removeItem(prefillKey(code));
  } catch {
    /* storage unavailable */
  }
}
