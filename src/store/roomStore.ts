// Room store. The server's room:state snapshot is the single source of truth for players, settings, host and
// the empty-room deadline; this store only mirrors it (see lib/roomClient.ts). Chat messages also come from the server.
import { create } from "zustand";
import { DEFAULT_SETTINGS as SHARED_DEFAULTS, type RoomSettings } from "@/shared/settings";
import type { SystemCode, SystemParams } from "@/lib/gameQueue";
import { sound } from "@/lib/sound";

export type RoomStage = "loading" | "enterName" | "pickCharacter" | "lobby" | "closed" | "error";

export interface RoomPlayer {
  id: string;
  nickname: string;
  /** Character id from public/characters/characters.json ("c01".."cNN"), null until chosen. */
  characterId: string | null;
  isHost: boolean;
  connected?: boolean;
  /** A computer player (shows a Bot badge). */
  isBot?: boolean;
}

export type { RoomSettings } from "@/shared/settings";

/** Shape of the server's room:state payload. */
export interface RoomSnapshot {
  code: string;
  status: "waiting" | "playing" | "closed";
  hostPlayerId: string;
  settings: RoomSettings;
  players: { playerId: string; nickname: string; characterId: string | null; isHost: boolean; connected: boolean; isBot?: boolean }[];
  expiresAt: number | null;
  serverNow: number;
  /** When the next bot joins an empty seat (server time, ms), or null. */
  botRefillAt?: number | null;
}

export type ClosedReason = "EXPIRED_EMPTY" | "ALL_LEFT" | "SERVER_RESTART";

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  characterId: string | null;
  text: string;
  /** Local clock time (ms): the server time already shifted by the clock offset. */
  at: number;
  /** A system line built from an event code (muted style in the chat): text lives in messages game.system.<code>. */
  system?: { code: SystemCode; params: SystemParams };
}

const CHAT_KEEP = 200;

export const DEFAULT_SETTINGS: RoomSettings = SHARED_DEFAULTS;

interface RoomState {
  code: string | null;
  stage: RoomStage;
  /** True until the server answered the first join (the loading screen waits for it). */
  isCreating: boolean;
  /** The loading overlay has finished playing. */
  loaderDone: boolean;
  meId: string | null;
  nickname: string;
  players: RoomPlayer[];
  hostPlayerId: string | null;
  draftCharacter: string | null;
  settings: RoomSettings;
  /** Deadline of the empty-room timer in server time (ms), or null. */
  expiresAt: number | null;
  /** When the next bot joins (server time, ms), or null. */
  botRefillAt: number | null;
  /** serverNow - Date.now() at the last snapshot; makes the countdown clock-skew safe. */
  clockOffset: number;
  closedReason: ClosedReason | null;
  /** Language-agnostic error code for the error stage or the last failed action. */
  errorCode: string | null;
  messages: ChatMessage[];
  soundOn: boolean;
  selectedTile: number | null;

  begin: (code: string) => void;
  patch: (partial: Partial<RoomState>) => void;
  applySnapshot: (snapshot: RoomSnapshot) => void;
  finishLoading: () => void;
  selectCharacter: (characterId: string) => void;
  changeAppearance: () => void;
  /** Chat messages arrive from the server (lib/roomClient.ts); duplicates (same id) are ignored. */
  addMessage: (message: ChatMessage) => void;
  addSystemMessage: (code: SystemCode, params: SystemParams) => void;
  setMessages: (messages: ChatMessage[]) => void;
  toggleSound: () => void;
  selectTile: (index: number | null) => void;
}

const initial = {
  code: null,
  stage: "loading" as RoomStage,
  isCreating: true,
  loaderDone: false,
  meId: null as string | null,
  nickname: "",
  players: [] as RoomPlayer[],
  hostPlayerId: null as string | null,
  draftCharacter: null as string | null,
  settings: DEFAULT_SETTINGS,
  expiresAt: null as number | null,
  botRefillAt: null as number | null,
  clockOffset: 0,
  closedReason: null as ClosedReason | null,
  errorCode: null as string | null,
  messages: [] as ChatMessage[],
  selectedTile: null as number | null,
};

export const useRoomStore = create<RoomState>((set, get) => ({
  ...initial,
  soundOn: true,

  begin: (code) => set({ ...initial, code, soundOn: get().soundOn }),

  patch: (partial) => set(partial),

  applySnapshot: (snapshot) => {
    const meId = get().meId;
    const me = snapshot.players.find((p) => p.playerId === meId);
    set({
      code: snapshot.code,
      players: snapshot.players.map((p) => ({ id: p.playerId, nickname: p.nickname, characterId: p.characterId, isHost: p.isHost, connected: p.connected, isBot: p.isBot ?? false })),
      hostPlayerId: snapshot.hostPlayerId,
      settings: snapshot.settings,
      expiresAt: snapshot.expiresAt,
      botRefillAt: snapshot.botRefillAt ?? null,
      clockOffset: snapshot.serverNow - Date.now(),
      nickname: me?.nickname ?? get().nickname,
    });
  },

  finishLoading: () => set({ loaderDone: true }),

  selectCharacter: (characterId) => set({ draftCharacter: characterId, errorCode: null }),

  changeAppearance: () => {
    const me = get().players.find((p) => p.id === get().meId);
    set({ stage: "pickCharacter", draftCharacter: me?.characterId ?? get().draftCharacter, selectedTile: null, errorCode: null });
  },

  addMessage: (message) =>
    set((s) => (s.messages.some((m) => m.id === message.id) ? s : { messages: [...s.messages, message].slice(-CHAT_KEEP) })),

  setMessages: (messages) => set({ messages: messages.slice(-CHAT_KEEP) }),

  addSystemMessage: (code, params) =>
    set((s) => ({
      messages: [...s.messages, { id: `sys-${Date.now()}-${s.messages.length}`, playerId: "system", name: "", characterId: null, text: "", at: Date.now(), system: { code, params } }].slice(-CHAT_KEEP),
    })),

  toggleSound: () =>
    set((s) => {
      sound.setEnabled(!s.soundOn);
      return { soundOn: !s.soundOn };
    }),

  selectTile: (index) => set((s) => ({ selectedTile: s.selectedTile === index ? null : index })),
}));

// Dev-only handle for manual testing in the browser console (never in production).
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __roomStore?: typeof useRoomStore }).__roomStore = useRoomStore;
}
