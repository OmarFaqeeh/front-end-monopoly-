"use client";
// Pair of dice. WebGL model loaded lazily; the CSS dice are only the loading placeholder and the no-WebGL fallback.
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Component, useState, useSyncExternalStore, type ReactNode } from "react";
import { useReducedMotionPref } from "@/lib/motion";
import DiceCss from "./dice/DiceCss";

export interface DicePairProps {
  /** Values shown when settled (1 to 6). */
  values: [number, number];
  /** Increment to roll (the scene tosses and lands exactly on `values`). */
  rollKey?: number;
  /** Die size as a CSS length (the canvas is about 2.8 x 1.9 die sizes). */
  size?: string;
  /** Clickable (hover lifts a die, click calls onRequestRoll). */
  interactive?: boolean;
  onRequestRoll?: () => void;
  /** The dice leave the table (after the result was shown). */
  hidden?: boolean;
  /** A wider canvas (the dice are thrown in from the sides of the board center). */
  wide?: boolean;
  /** Called when both dice have settled. */
  onRolled?: () => void;
  /** Dev only: continuous two-axis rotation. */
  autoRotate?: boolean;
  className?: string;
}

function Fallback({ values, size, rollKey }: { values: [number, number]; size: string; rollKey: number }) {
  return (
    <div className="flex size-full items-center justify-center" style={{ gap: `calc(${size} * 0.25)` }}>
      <DiceCss value={values[0]} rollKey={rollKey} spin={2} size={size} />
      <DiceCss value={values[1]} rollKey={rollKey} spin={4} size={size} />
    </div>
  );
}

const DiceCanvas = dynamic(() => import("./dice/DiceCanvas"), { ssr: false });

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const noopSubscribe = () => () => {};
function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

export default function DicePair({
  values,
  rollKey = 0,
  size = "64px",
  interactive = false,
  onRequestRoll,
  onRolled,
  hidden,
  wide,
  autoRotate,
  className,
}: DicePairProps) {
  const t = useTranslations("room");
  const webgl = useSyncExternalStore(noopSubscribe, detectWebGL, () => true);
  const reduced = useReducedMotionPref();
  const [announce, setAnnounce] = useState("");
  const label = t("diceLabel", { a: values[0], b: values[1] });

  const fallback = <Fallback values={values} size={size} rollKey={rollKey} />;

  return (
    <div
      role="img"
      aria-label={label}
      className={clsx("relative shrink-0", interactive && "cursor-pointer", className)}
      style={{ width: `calc(${size} * 2.8)`, height: `calc(${size} * 1.9)`, ["--s" as string]: size }}
      onClick={!webgl && interactive ? onRequestRoll : undefined}
    >
      {webgl ? (
        <Boundary fallback={fallback}>
          {/* The drawing frame can be much bigger than the resting dice (wide): it is centered on them, transparent, and
              ignores the pointer, so the dice are thrown across the whole board center and never appear from a frame edge. */}
          <div
            className={wide ? "pointer-events-none absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" : "size-full"}
            style={wide ? { width: `calc(${size} * 11)`, height: `calc(${size} * 4.6)` } : undefined}
          >
          <DiceCanvas
            fovScale={wide ? 4.6 / 1.9 : 1}
            values={values}
            rollKey={rollKey}
            reduced={reduced}
            hidden={hidden}
            interactive={interactive}
            autoRotate={autoRotate}
            onRequestRoll={onRequestRoll}
            onRolled={() => {
              setAnnounce(label);
              onRolled?.();
            }}
          />
          </div>
        </Boundary>
      ) : (
        fallback
      )}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
