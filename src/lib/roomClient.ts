// Room connection logic: socket events -> store. All server calls for the room page go through here.
import { ApiError, lookupRoom } from "./api";
import { clearCredentials, clearPrefill, getPrefill, loadCredentials, saveCredentials, type RoomCredentials } from "./roomSession";
import { attachGameListeners, resetGame } from "./gameClient";
import { disconnectSocket, emitAck, getSocket } from "./socket";
import { useRoomStore, type ChatMessage, type ClosedReason, type RoomSettings, type RoomSnapshot } from "@/store/roomStore";

/** A chat message as the server sends it (server clock, `nickname`). */
interface ServerChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  characterId: string | null;
  text: string;
  at: number;
  system?: { code: string; params: Record<string, string | number> };
}

type JoinAck =
  | { ok: true; playerId: string; playerToken?: string; state: RoomSnapshot; messages?: ServerChatMessage[] }
  | { ok: false; error: string };
type StateAck = { ok: true; state: RoomSnapshot } | { ok: false; error: string };

const store = () => useRoomStore.getState();

/** Server time -> local clock, using the offset from the latest room snapshot. */
const toLocal = (m: ServerChatMessage): ChatMessage => ({
  id: m.id,
  playerId: m.playerId,
  name: m.nickname,
  characterId: m.characterId,
  text: m.text,
  at: m.at - store().clockOffset,
  ...(m.system ? { system: m.system as ChatMessage["system"] } : {}),
});

/** Takes the chat history from a join ack (after the snapshot, so the clock offset is current). */
function applyHistory(res: { messages?: ServerChatMessage[] }): void {
  if (res.messages) store().setMessages(res.messages.map(toLocal));
}

let credentials: RoomCredentials | null = null;
let currentCode: string | null = null;
let everConnected = false;
/** Incremented on every enterRoom: results of an abandoned attempt (React StrictMode remount) are ignored. */
let epoch = 0;

function stageFor(snapshot: RoomSnapshot, meId: string): "pickCharacter" | "lobby" {
  const me = snapshot.players.find((p) => p.playerId === meId);
  return me?.characterId ? "lobby" : "pickCharacter";
}

/** Join (or re-join) the room with the stored credentials, or as a new guest. */
async function sendJoin(code: string, nickname: string, creds: RoomCredentials | null): Promise<JoinAck> {
  try {
    return await emitAck<JoinAck>("room:join", { code, nickname, ...(creds ?? {}) });
  } catch {
    return { ok: false, error: "NETWORK_ERROR" };
  }
}

function listen(code: string): void {
  const socket = getSocket();
  socket.off("room:state").on("room:state", (snapshot: RoomSnapshot) => {
    if (snapshot.code === code) store().applySnapshot(snapshot);
  });
  attachGameListeners(socket);
  socket.off("chat:message").on("chat:message", (message: ServerChatMessage) => {
    store().addMessage(toLocal(message));
  });
  socket.off("room:closed").on("room:closed", (payload: { reason: ClosedReason }) => {
    store().patch({ stage: "closed", closedReason: payload.reason });
  });
  socket.off("connect").on("connect", () => {
    if (!everConnected) {
      everConnected = true;
      return;
    }
    // Reconnected after a drop: take the same seat back.
    if (credentials && currentCode === code) {
      void sendJoin(code, store().nickname, credentials).then((r) => {
        if (r.ok) {
          store().applySnapshot(r.state);
          applyHistory(r); // catch up on messages missed while offline
        }
      });
    }
  });
  socket.off("connect_error").on("connect_error", () => {
    if (!everConnected && store().stage === "loading") store().patch({ stage: "error", errorCode: "NETWORK_ERROR", isCreating: false });
  });
}

/** Called once when the room page opens. `nicknameHint` is the last nickname used in the browser. */
export async function enterRoom(code: string, nicknameHint: string): Promise<void> {
  disconnectSocket();
  resetGame();
  const mine = ++epoch;
  everConnected = false;
  currentCode = code;
  credentials = loadCredentials(code);
  store().begin(code);

  // Yield once: a React StrictMode remount cancels this attempt before anything is sent to the server.
  await Promise.resolve();
  if (mine !== epoch) return;

  const socket = getSocket();
  listen(code);
  socket.connect();

  const prefill = getPrefill(code);

  // 1) Returning player or host: rejoin with the stored credentials.
  if (credentials) {
    const res = await sendJoin(code, nicknameHint || "player", credentials);
    if (mine !== epoch) return;
    if (res.ok) {
      store().patch({ meId: res.playerId, isCreating: false });
      store().applySnapshot(res.state);
      applyHistory(res);
      store().patch({ stage: stageFor(res.state, res.playerId) });
      return;
    }
    if (res.error !== "INVALID_CREDENTIALS") {
      store().patch({ stage: "error", errorCode: res.error, isCreating: false });
      return;
    }
    clearCredentials(code);
    credentials = null;
  }

  // 2) New guest. Arriving from the Play page the name is already known; from an invite link ask for it.
  if (prefill) {
    await joinAsGuest(prefill);
    return;
  }
  if (mine !== epoch) return;
  // Check the room can be joined before asking for a name (no socket event needed).
  try {
    const info = await lookupRoom(code);
    if (mine !== epoch) return;
    if (!info.joinable) {
      store().patch({ stage: "error", errorCode: info.reason ?? "ROOM_NOT_FOUND", isCreating: false });
      return;
    }
  } catch (e) {
    if (mine !== epoch) return;
    store().patch({ stage: "error", errorCode: e instanceof ApiError ? e.code : "NETWORK_ERROR", isCreating: false });
    return;
  }
  store().patch({ stage: "enterName", nickname: nicknameHint, isCreating: false });
}

/** Join as a new guest with a chosen nickname. Returns an error code on failure (and stays on the name step). */
export async function joinAsGuest(nickname: string): Promise<string | null> {
  const code = currentCode;
  if (!code) return "ROOM_NOT_FOUND";
  const res = await sendJoin(code, nickname, null);
  if (!res.ok) {
    if (res.error === "ROOM_NOT_FOUND" || res.error === "ROOM_FULL" || res.error === "GAME_STARTED" || res.error === "NETWORK_ERROR") {
      store().patch({ stage: "error", errorCode: res.error, isCreating: false });
    } else store().patch({ stage: "enterName", isCreating: false });
    return res.error;
  }
  if (res.playerToken) {
    credentials = { playerId: res.playerId, playerToken: res.playerToken };
    saveCredentials(code, credentials);
  }
  clearPrefill(code);
  store().patch({ meId: res.playerId, isCreating: false, nickname });
  store().applySnapshot(res.state);
  applyHistory(res);
  store().patch({ stage: stageFor(res.state, res.playerId) });
  return null;
}

/** Host only: removes a bot from the lobby (the server refuses anything else). */
export async function removeBot(playerId: string): Promise<string | null> {
  try {
    const res = await emitAck<{ ok: true } | { ok: false; error: string }>("room:removeBot", { playerId });
    return res.ok ? null : res.error;
  } catch {
    return "NETWORK_ERROR";
  }
}

/** Sends a chat message. The message itself comes back through the "chat:message" broadcast. Returns an error code or null. */
export async function sendChatMessage(text: string): Promise<string | null> {
  const clean = text.trim();
  if (!clean) return "MESSAGE_INVALID";
  try {
    const res = await emitAck<{ ok: true; message: ServerChatMessage } | { ok: false; error: string }>("chat:send", { text: clean });
    if (!res.ok) return res.error;
    store().addMessage(toLocal(res.message)); // same id as the broadcast: shown once
    return null;
  } catch {
    return "NETWORK_ERROR";
  }
}

/** Confirm the drafted character; the server resolves races (CHARACTER_TAKEN). */
export async function confirmCharacter(): Promise<string | null> {
  const draft = store().draftCharacter;
  if (!draft) return "INVALID_CHARACTER";
  try {
    const res = await emitAck<StateAck>("player:selectCharacter", { characterId: draft });
    if (!res.ok) {
      store().patch({ errorCode: res.error });
      return res.error;
    }
    store().applySnapshot(res.state);
    store().patch({ stage: "lobby", errorCode: null });
    return null;
  } catch {
    store().patch({ errorCode: "NETWORK_ERROR" });
    return "NETWORK_ERROR";
  }
}

/** Host-only (enforced by the server). Optimistic update with rollback on error. */
export async function updateSetting<K extends keyof RoomSettings>(key: K, value: RoomSettings[K]): Promise<void> {
  const previous = store().settings;
  store().patch({ settings: { ...previous, [key]: value } });
  try {
    const res = await emitAck<StateAck>("room:updateSettings", { patch: { [key]: value } });
    if (res.ok) store().applySnapshot(res.state);
    else store().patch({ settings: previous, errorCode: res.error });
  } catch {
    store().patch({ settings: previous, errorCode: "NETWORK_ERROR" });
  }
}

export async function leaveRoom(): Promise<void> {
  const code = currentCode;
  try {
    if (getSocket().connected) await emitAck("room:leave", {}, 2000);
  } catch {
    /* leaving anyway */
  }
  if (code) clearCredentials(code);
  credentials = null;
  currentCode = null;
  disconnectSocket();
  resetGame();
}

/** Stop listening when the room page unmounts (the seat is kept for the server's grace period). */
export function disconnectRoom(): void {
  epoch++;
  currentCode = null;
  disconnectSocket();
}
