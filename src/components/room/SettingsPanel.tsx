"use client";
// Settings card: locked until the user joins; only the host edits, everyone else sees it read-only.
import clsx from "clsx";
import {
  Bot, Building2, Coins, Gavel, Landmark, Layers, Lock, Map as MapIcon, TreePalm, Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatMoney } from "@/lib/money";
import { updateSetting } from "@/lib/roomClient";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore, type RoomSettings } from "@/store/roomStore";
import SettingRow from "./SettingRow";
import Select from "./Select";
import Toggle from "./Toggle";

type ToggleKey = "allowBots" | "doubleRentSets" | "oasisJackpot" | "auctions" | "noRentInDetention" | "mortgage" | "evenBuild";

const GAME: { key: ToggleKey; Icon: LucideIcon; beta?: boolean }[] = [
  { key: "allowBots", Icon: Bot, beta: true },
];
const RULES: { key: ToggleKey; Icon: LucideIcon }[] = [
  { key: "doubleRentSets", Icon: Layers },
  { key: "oasisJackpot", Icon: TreePalm },
  { key: "auctions", Icon: Gavel },
  { key: "noRentInDetention", Icon: Lock },
  { key: "mortgage", Icon: Landmark },
  { key: "evenBuild", Icon: Building2 },
];
const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: String(n) }));
const CASH_OPTIONS = [1000, 1500, 2000, 2500, 5000].map((n) => ({ value: n, label: formatMoney(n) }));

export default function SettingsPanel() {
  const t = useTranslations("room.settings");
  const stage = useRoomStore((s) => s.stage);
  const settings = useRoomStore((s) => s.settings);
  const players = useRoomStore((s) => s.players);
  const meId = useRoomStore((s) => s.meId);
  const update = <K extends keyof RoomSettings>(k: K, v: RoomSettings[K]) => void updateSetting(k, v);

  const inGame = useGameStore((s) => s.display !== null);
  const joined = stage === "lobby";
  const isHost = players.find((p) => p.id === meId)?.isHost ?? false;
  const locked = !joined;
  // Settings are frozen once the game starts (the server also rejects changes with NOT_ALLOWED_IN_GAME).
  const readOnly = joined && (!isHost || inGame);

  const toggleRow = (key: ToggleKey, Icon: LucideIcon, beta?: boolean) => (
    <SettingRow key={key} Icon={Icon} title={t(`items.${key}.title`)} description={t(`items.${key}.desc`)} badge={beta ? t("beta") : undefined}>
      <Toggle
        checked={settings[key]}
        label={t(`items.${key}.title`)}
        disabled={locked || readOnly}
        onChange={(v) => update(key as keyof RoomSettings, v as never)}
      />
    </SettingRow>
  );

  return (
    <Card className="settings-card overflow-hidden" aria-disabled={locked || undefined}>
      {locked && (
        <div className="flex items-center gap-2 border-b border-line bg-accent-soft px-5 py-3 text-sm font-semibold text-on-accent">
          <Lock size={16} strokeWidth={1.5} aria-hidden="true" />
          {t("locked")}
        </div>
      )}
      {readOnly && (
        <div className="flex items-center gap-2 border-b border-line bg-brand-soft px-5 py-3 text-sm text-ink">
          <Lock size={16} strokeWidth={1.5} aria-hidden="true" />
          {inGame ? t("lockedInGame") : t("hostOnly")}
        </div>
      )}
      <div className={clsx("px-5 pb-3", locked && "pointer-events-none opacity-50")}>
        <h3 className="pt-5 pb-1 text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{t("gameTitle")}</h3>
        <div className="divide-y divide-line">
          <SettingRow Icon={Users} title={t("items.maxPlayers.title")} description={t("items.maxPlayers.desc")}>
            <Select
              value={settings.maxPlayers}
              options={PLAYER_OPTIONS}
              label={t("items.maxPlayers.title")}
              disabled={locked || readOnly}
              onChange={(v) => update("maxPlayers", v)}
            />
          </SettingRow>
          {GAME.map(({ key, Icon, beta }) => toggleRow(key, Icon, beta))}
          <SettingRow Icon={MapIcon} title={t("items.boardMap.title")} description={t("items.boardMap.desc")}>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-sm font-semibold text-ink">{t("classic")}</span>
              <Button variant="outline" size="sm" disabled className="h-8 px-3 text-xs">
                {t("comingSoon")}
              </Button>
            </div>
          </SettingRow>
        </div>

        <div className="my-4 h-px bg-line" />

        <h3 className="pb-1 text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{t("rulesTitle")}</h3>
        <div className="divide-y divide-line">
          {RULES.map(({ key, Icon }) => toggleRow(key, Icon))}
          <SettingRow Icon={Coins} title={t("items.startingCash.title")} description={t("items.startingCash.desc")}>
            <Select
              value={settings.startingCash}
              options={CASH_OPTIONS}
              label={t("items.startingCash.title")}
              disabled={locked || readOnly}
              onChange={(v) => update("startingCash", v as RoomSettings["startingCash"])}
            />
          </SettingRow>
        </div>
      </div>
    </Card>
  );
}
