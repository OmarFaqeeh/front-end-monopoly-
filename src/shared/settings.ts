// Room settings: ONE schema used by the back-end (validation, defaults) and the front (panel, types).
// Copied into back/src/shared and front/src/shared by scripts/sync-shared.mjs: edit it only here.
import { z } from "zod";

export const STARTING_CASH_OPTIONS = [1000, 1500, 2000, 2500, 5000] as const;
export const MAX_PLAYERS_MIN = 2;
export const MAX_PLAYERS_MAX = 8;

export const roomSettingsSchema = z.strictObject({
  maxPlayers: z.number().int().min(MAX_PLAYERS_MIN).max(MAX_PLAYERS_MAX),
  allowBots: z.boolean(),
  /** Display only: the engine always plays the classic board. */
  boardMap: z.literal("classic"),
  doubleRentSets: z.boolean(),
  oasisJackpot: z.boolean(),
  auctions: z.boolean(),
  noRentInDetention: z.boolean(),
  mortgage: z.boolean(),
  evenBuild: z.boolean(),
  startingCash: z.union([z.literal(1000), z.literal(1500), z.literal(2000), z.literal(2500), z.literal(5000)]),
});

export type RoomSettings = z.infer<typeof roomSettingsSchema>;

export const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 4,
  allowBots: false,
  boardMap: "classic",
  doubleRentSets: false,
  oasisJackpot: false,
  auctions: true,
  noRentInDetention: false,
  mortgage: false,
  evenBuild: true,
  startingCash: 1500,
};

/** A partial update; unknown keys are rejected. */
export const settingsPatchSchema = roomSettingsSchema.partial().refine((p) => Object.keys(p).length > 0, "empty patch");
export type SettingsPatch = z.infer<typeof settingsPatchSchema>;

/** The rule settings the engine uses. Copied into the game when it starts and frozen for the whole game. */
export interface GameRules {
  startingCash: number;
  doubleRentSets: boolean;
  oasisJackpot: boolean;
  auctions: boolean;
  noRentInDetention: boolean;
  mortgage: boolean;
  evenBuild: boolean;
}

export const DEFAULT_RULES: GameRules = {
  startingCash: DEFAULT_SETTINGS.startingCash,
  doubleRentSets: false,
  oasisJackpot: false,
  auctions: true,
  noRentInDetention: false,
  mortgage: false,
  evenBuild: true,
};

export function rulesFromSettings(s: RoomSettings): GameRules {
  return {
    startingCash: s.startingCash,
    doubleRentSets: s.doubleRentSets,
    oasisJackpot: s.oasisJackpot,
    auctions: s.auctions,
    noRentInDetention: s.noRentInDetention,
    mortgage: s.mortgage,
    evenBuild: s.evenBuild,
  };
}
