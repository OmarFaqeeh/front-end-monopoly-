// Durations (ms) of the game animations. They live in shared/timing.ts so the server (bots) knows how long a client
// needs to play an event batch; the front's animation queue uses exactly these numbers.
export { GAME_TIMING, REDUCED_MOTION_FACTOR, estimateAnimationMs, type GameTiming } from "@/shared/timing";
