"use client";
// Cinematic loading overlay: ring builds itself, comet circles it, dice tumble, code scrambles in.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import DicePair from "@/components/board/DicePair";
import GoldDust from "@/components/hero/GoldDust";
import { BOARD_LAYOUT } from "@/config/boardLayout";
import { ringPath, tileRects } from "@/lib/boardGeometry";
import { useRoomStore } from "@/store/roomStore";

const SIZE = 400;
const RECTS = tileRects(SIZE);
const PATH = ringPath(SIZE);
const MIN_MS = 2800;
const REDUCED_MS = 1200;
function ScrambleCode({ code }: { code: string }) {
  const [shown, setShown] = useState(() => code.replace(/./g, " "));

  useEffect(() => {
    const start = performance.now();
    const rand = () => "0123456789"[Math.floor(Math.random() * 10)]!;
    const id = window.setInterval(() => {
      const elapsed = performance.now() - start;
      if (elapsed < 1400) return;
      const settled = Math.min(code.length, Math.floor((elapsed - 1400) / (1000 / code.length)));
      setShown(
        code
          .split("")
          .map((ch, i) => (i < settled ? ch : rand()))
          .join(""),
      );
      if (settled >= code.length) window.clearInterval(id);
    }, 55);
    return () => window.clearInterval(id);
  }, [code]);

  return (
    <p dir="ltr" aria-label={code} className="gold-foil font-mono text-3xl font-semibold tracking-[0.35em] sm:text-4xl">
      {shown}
    </p>
  );
}

function StatusLine({ steps }: { steps: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const timers = [950, 1900].map((ms, k) => window.setTimeout(() => setI(k + 1), ms));
    return () => timers.forEach(window.clearTimeout);
  }, []);
  return (
    <div className="relative h-6 text-center text-sm tracking-wide text-(--hero-text)/90" role="status">
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {steps[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default function RoomLoader({ code, onDone }: { code: string; onDone: () => void }) {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const isCreating = useRoomStore((s) => s.isCreating);
  const [minElapsed, setMinElapsed] = useState(false);
  const [tossed, setTossed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMinElapsed(true), reduce ? REDUCED_MS : MIN_MS);
    return () => window.clearTimeout(id);
  }, [reduce]);

  useEffect(() => {
    const id = window.setTimeout(() => setTossed(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (minElapsed && !isCreating) onDone();
  }, [minElapsed, isCreating, onDone]);

  const steps = [t("room.loader.laying"), t("room.loader.shuffling"), t("room.loader.seat")];
  const pending = minElapsed && isCreating;

  const bar = (
    <div
      role="progressbar"
      aria-label={t("room.loader.progress")}
      className="relative h-[3px] w-full overflow-hidden rounded-full bg-(--hero-text)/15"
    >
      <motion.div
        className={`absolute inset-y-0 start-0 rounded-full bg-(--hero-gold-2) ${pending ? "bar-shimmer" : ""}`}
        initial={{ width: "0%" }}
        animate={{ width: pending ? "92%" : "100%" }}
        transition={reduce ? { duration: REDUCED_MS / 1000, ease: "linear" } : { duration: 2.4, delay: 0.4, ease: "linear" }}
      />
    </div>
  );

  return (
    <motion.div
      className="hero-scope fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-(--hero-ink) px-4 text-(--hero-text)"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(14px)" }}
      transition={{ duration: reduce ? 0.4 : 0.5, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--hero-ink)_55%,var(--brand))_0%,var(--hero-ink)_72%)]" />
      {!reduce && <GoldDust />}

      {reduce ? (
        <div className="relative flex w-full max-w-xs flex-col items-center gap-6 text-center">
          <p className="gold-foil font-heading text-5xl font-semibold tracking-[0.14em] uppercase">
            {t("landing.wordmark.latin")}
          </p>
          {bar}
          <p role="status" className="text-sm tracking-wide">
            {steps[0]}
          </p>
        </div>
      ) : (
        <div className="relative flex w-full flex-col items-center gap-6" style={{ maxWidth: "min(80vw, 560px)" }}>
          <motion.div
            className="relative w-full"
            style={{ aspectRatio: "1 / 1" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
              <defs>
                <filter id="comet-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="sweep-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="var(--hero-text)" stopOpacity="0" />
                  <stop offset="0.5" stopColor="var(--hero-text)" stopOpacity="0.55" />
                  <stop offset="1" stopColor="var(--hero-text)" stopOpacity="0" />
                </linearGradient>
                <clipPath id="ring-clip">
                  {RECTS.map((r) => (
                    <rect key={r.index} x={r.x} y={r.y} width={r.w} height={r.h} rx="2" />
                  ))}
                </clipPath>
              </defs>

              {RECTS.map((r) => {
                const tile = BOARD_LAYOUT[r.index]!;
                const delay = 0.2 + r.index * 0.035;
                const cx = r.x + r.w / 2;
                const cy = r.y + r.h / 2;
                return (
                  <motion.g
                    key={r.index}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay, ease: "easeOut" }}
                    style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" }}
                  >
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="2" fill="color-mix(in srgb, var(--hero-text) 7%, transparent)" stroke="var(--hero-gold-2)" strokeOpacity="0.35" strokeWidth="0.8" />
                    {tile.group && (
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={Math.min(r.w, r.h) * 0.2}
                        fill={`var(--group-${tile.group})`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 14, delay: delay + 0.18 }}
                        style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" }}
                      />
                    )}
                  </motion.g>
                );
              })}

              <motion.path d={PATH} pathLength={100} fill="none" stroke="var(--hero-gold-2)" strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="28 72" initial={{ strokeDashoffset: 22 }} animate={{ strokeDashoffset: -78 }} transition={{ duration: 1.5, delay: 0.2, ease: "linear" }} />
              <motion.path d={PATH} pathLength={100} fill="none" stroke="var(--hero-gold-1)" strokeWidth="4" strokeLinecap="round" strokeDasharray="5 95" filter="url(#comet-glow)" initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -100 }} transition={{ duration: 1.5, delay: 0.2, ease: "linear" }} />

              <g clipPath="url(#ring-clip)">
                <motion.rect
                  x={-SIZE * 0.4}
                  y="0"
                  width={SIZE * 0.4}
                  height={SIZE}
                  fill="url(#sweep-grad)"
                  initial={{ x: -SIZE * 0.4 }}
                  animate={{ x: SIZE * 1.1 }}
                  transition={{ duration: 0.6, delay: 2.4, ease: "easeInOut" }}
                />
              </g>
            </svg>

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, y: -160 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
            >
              <DicePair values={tossed ? [5, 2] : [1, 1]} rollKey={tossed ? 1 : 0} size="clamp(44px, 9vw, 72px)" />
            </motion.div>
          </motion.div>

          <ScrambleCode code={code} />
          <div className="flex w-full flex-col gap-4">
            {bar}
            <StatusLine steps={steps} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
