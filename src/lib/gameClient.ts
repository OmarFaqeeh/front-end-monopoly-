// Game connection logic: socket events -> game store (through the animation queue) and the player's actions.
import type { Socket } from "socket.io-client";
import type { BuildKind, GameEventsPayload, GameSnapshot, TradeSide } from "@/shared/events";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";
import { GameQueue } from "./gameQueue";
import { emitAck } from "./socket";
import { isReducedMotion } from "./motion";
import { sound } from "./sound";


export const gameQueue = new GameQueue({
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  play: (name) => sound.play(name),
  reduced: isReducedMotion,
  meId: () => useRoomStore.getState().meId,
  nameOf: (id) => useRoomStore.getState().players.find((p) => p.id === id)?.nickname ?? "Someone",
  system: (code, params) => useRoomStore.getState().addSystemMessage(code, params),
});

/** Listens to the game events of the room socket. Safe to call again for a new socket. */
export function attachGameListeners(socket: Socket): void {
  socket.off("game:started").on("game:started", (p: { snapshot: GameSnapshot }) => {
    gameQueue.adopt(p.snapshot);
    sound.play("start");
  });
  socket.off("game:events").on("game:events", (p: GameEventsPayload) => gameQueue.push(p));
  socket.off("game:sync").on("game:sync", (p: { snapshot: GameSnapshot }) => gameQueue.adopt(p.snapshot));
}

/** Forget everything about the current game (entering or leaving a room). */
export function resetGame(): void {
  gameQueue.reset();
  useGameStore.getState().reset();
}

const newActionId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `a-${Date.now()}-${Math.random().toString(36).slice(2)}`);

let errorTimer: ReturnType<typeof setTimeout> | undefined;
function showError(code: string): void {
  useGameStore.getState().patch({ actionError: code });
  clearTimeout(errorTimer);
  errorTimer = setTimeout(() => useGameStore.getState().patch({ actionError: null }), 4000);
}

type Ack = { ok: true } | { ok: false; error: string };

async function send(event: string, extra: object = {}): Promise<string | null> {
  try {
    const res = await emitAck<Ack>(event, { actionId: newActionId(), ...extra });
    if (!res.ok) {
      showError(res.error);
      return res.error;
    }
    return null;
  } catch {
    showError("NETWORK_ERROR");
    return "NETWORK_ERROR";
  }
}

export const startGame = () => send("game:start");
export const rollDice = () => send("game:roll");
export const buyProperty = () => send("game:buy");
export const skipProperty = () => send("game:skip");
export const payJailFine = () => send("game:jailPay");
export const stayInJail = () => send("game:jailStay");
export const bidAuction = async (amount: number) => {
  const code = await send("game:bid", { amount });
  if (code === null) useGameStore.getState().patch({ iBid: true });
  return code;
};
export const withdrawAuction = () => send("game:withdraw");
export const mortgageTile = (tileIndex: number) => send("game:mortgage", { tileIndex });
export const unmortgageTile = (tileIndex: number) => send("game:unmortgage", { tileIndex });
export const payDebt = () => send("game:payDebt");
export const declareBankruptcy = () => send("game:declareBankruptcy");
export const resignGame = () => send("game:resign");
export const proposeTrade = (toId: string, give: TradeSide, get: TradeSide) => send("game:proposeTrade", { toId, give, get });
export const acceptTrade = (tradeId: string) => send("game:acceptTrade", { tradeId });
export const rejectTrade = (tradeId: string) => send("game:rejectTrade", { tradeId });
export const cancelTrade = (tradeId: string) => send("game:cancelTrade", { tradeId });
export const buildOn = (tileIndex: number, kind: BuildKind) => send("game:build", { tileIndex, kind });
