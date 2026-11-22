"use client";
// Room page shell. Stages: loading (connecting) -> enterName (guests) -> pickCharacter -> lobby, plus closed/error.
// Guests arriving by invite link always get the name step; the server's room:state drives everything else.
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect } from "react";
import Board from "@/components/board/Board";
import { BankruptToast, GameAnnouncer, GameOverOverlay } from "@/components/game/GameOverlays";
import TurnBanner from "@/components/game/TurnBanner";
import TradeCard from "@/components/trade/TradeCard";
import PlayerPicker from "@/components/trade/PlayerPicker";
import TradeDialog from "@/components/trade/TradeDialog";
import TradeToast from "@/components/trade/TradeToast";
import { loadMotionPref } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { useRouter } from "@/i18n/navigation";
import { disconnectRoom, enterRoom } from "@/lib/roomClient";
import { useRoomStore } from "@/store/roomStore";
import { useGameStore } from "@/store/gameStore";
import { useUiStore } from "@/store/uiStore";
import ChatPanel from "./ChatPanel";
import ColorPicker from "./ColorPicker";
import CountdownPill from "./CountdownPill";
import NameStep from "./NameStep";
import PlayersCard from "./PlayersCard";
import RoomErrorScreen from "./RoomErrorScreen";
import RoomHeader from "./RoomHeader";
import RoomLoader from "./RoomLoader";
import SettingsPanel from "./SettingsPanel";
import SharePanel from "./SharePanel";
import StatusPill from "./StatusPill";

const CLOSED_QUERY = { EXPIRED_EMPTY: "expired", ALL_LEFT: "allleft", SERVER_RESTART: "restart" } as const;

export default function RoomShell({ code }: { code: string }) {
  const router = useRouter();
  const hydrated = useUiStore((s) => s.hydrated);
  const loadNickname = useUiStore((s) => s.loadNickname);
  const roomCode = useRoomStore((s) => s.code);
  const stage = useRoomStore((s) => s.stage);
  const loaderDone = useRoomStore((s) => s.loaderDone);
  const closedReason = useRoomStore((s) => s.closedReason);
  const players = useRoomStore((s) => s.players);
  const finishLoading = useRoomStore((s) => s.finishLoading);
  const inGame = useGameStore((s) => s.active);

  useEffect(() => {
    loadNickname();
  }, [loadNickname]);

  // Sounds: restore the saved on/off choice and unlock audio on the first click or key press.
  useEffect(() => {
    loadMotionPref();
    useRoomStore.setState({ soundOn: sound.loadPreference() });
    return sound.unlockOnGesture();
  }, []);

  // Connect once the browser nickname hint is known; the server decides what happens next.
  useEffect(() => {
    if (!hydrated) return;
    void enterRoom(code, useUiStore.getState().nickname);
    return () => disconnectRoom();
  }, [hydrated, code]);

  // The room was closed (empty-room timeout, everybody left, restart): back to the landing page with a banner.
  useEffect(() => {
    if (stage === "closed" && closedReason) router.replace({ pathname: "/", query: { closed: CLOSED_QUERY[closedReason] } });
  }, [stage, closedReason, router]);

  const onLoaded = useCallback(() => finishLoading(), [finishLoading]);

  if (!hydrated || roomCode !== code) return <div className="min-h-screen bg-surface" />;

  const overlayStage = stage === "enterName" || stage === "pickCharacter";
  const interactive = stage === "lobby";

  return (
    <>
      <main className="room-grid mx-auto w-full max-w-[1900px] p-2.5 sm:p-4 xl:p-5" data-ingame={inGame || overlayStage ? "" : undefined}>
        <div className="area-header">
          <RoomHeader />
        </div>
        <div className="area-share">
          <SharePanel code={code} />
        </div>
        <div className="area-chat">
          <ChatPanel />
        </div>

        <div className="area-board relative flex items-start justify-center xl:items-center">
          <div
            inert={!interactive}
            className={clsx(
              "w-full transition-[opacity,filter] duration-[600ms] motion-reduce:transition-none",
              overlayStage && "opacity-35 blur-[1.5px] saturate-[0.8]",
            )}
          >
            <TurnBanner />
            <Board interactive={interactive} players={players} />
          </div>
          {stage === "enterName" && loaderDone && <NameStep />}
          {stage === "pickCharacter" && loaderDone && <ColorPicker />}
        </div>

        <div className="area-right flex flex-col gap-5">
          <CountdownPill />
          <StatusPill />
          <PlayersCard />
          <TradeCard />
          <SettingsPanel />
        </div>
      </main>

      <AnimatePresence>{!loaderDone && <RoomLoader key="loader" code={code} onDone={onLoaded} />}</AnimatePresence>
      {stage === "error" && loaderDone && <RoomErrorScreen />}
      <PlayerPicker />
      <TradeDialog />
      <TradeToast />
      <GameOverOverlay />
      <BankruptToast />
      <GameAnnouncer />
    </>
  );
}
