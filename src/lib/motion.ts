// Motion preference for the GAME animations (dice throw, pawn walk, money, cards). It is the player's own choice in the
// room header (default: full animations) and does not follow the operating system setting, because many systems have
// "animation effects" switched off and the game would then look frozen. "reduced" cuts every wait to 40% and removes
// tumbling, zoom, hops and floating numbers.
import { useSyncExternalStore } from "react";

export const MOTION_STORAGE_KEY = "deal-rush:motion";
export type MotionPref = "full" | "reduced";

let current: MotionPref = "full";
const listeners = new Set<() => void>();

function apply(): void {
  if (typeof document !== "undefined") document.documentElement.dataset.motion = current;
  listeners.forEach((l) => l());
}

export function loadMotionPref(): MotionPref {
  try {
    current = window.localStorage.getItem(MOTION_STORAGE_KEY) === "reduced" ? "reduced" : "full";
  } catch {
    current = "full";
  }
  apply();
  return current;
}

export function setMotionPref(pref: MotionPref): void {
  current = pref;
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, pref);
  } catch {
    /* storage unavailable */
  }
  apply();
}

export const isReducedMotion = (): boolean => current === "reduced";

/** React hook: true when the player chose reduced animations. */
export function useReducedMotionPref(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
    () => current === "reduced",
    () => false,
  );
}
