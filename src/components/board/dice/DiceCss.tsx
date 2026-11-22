"use client";
// CSS die: ONLY the loading placeholder and the fallback when WebGL is unavailable (see DicePair).
// No grouping property (overflow, filter, opacity, mask, clip-path, contain, isolation) may sit on tilt, cube
// or any element between them, or the 3D context is flattened. Reduced motion crossfades on .die only.
import clsx from "clsx";
import { useEffect, useState } from "react";

/** Pip cells (0..8 in a 3x3 grid) per face value. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Face value -> CSS face class (front 1, back 6, right 3, left 4, top 2, bottom 5). */
const FACES = [
  { v: 1, cls: "f-front" },
  { v: 6, cls: "f-back" },
  { v: 3, cls: "f-right" },
  { v: 4, cls: "f-left" },
  { v: 2, cls: "f-top" },
  { v: 5, cls: "f-bottom" },
] as const;

/** Cube rotation [rx, ry] in degrees that brings value n to the viewer. */
export const FACE_ROTATION: Record<number, [number, number]> = {
  1: [0, 0],
  6: [0, 180],
  3: [0, -90],
  4: [0, 90],
  2: [-90, 0],
  5: [90, 0],
};

/** Smallest forward (positive) turn from `current` to `target` (mod 360), plus `extra` full turns. */
function forward(current: number, target: number, extra: number): number {
  const delta = (((target - current) % 360) + 360) % 360;
  return current + delta + 360 * extra;
}

function Faces({ core }: { core?: boolean }) {
  return (
    <>
      {FACES.map(({ v, cls }) => (
        <div key={`${core ? "c" : "o"}${v}`} className={clsx("die-face", cls, core && "die-core")}>
          {!core &&
            Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="die-cell">
                {PIPS[v]?.includes(i) && <span className="die-pip" />}
              </span>
            ))}
        </div>
      ))}
    </>
  );
}

export interface Dice3DProps {
  /** Face value shown when settled (1 to 6). */
  value: number;
  /** Increment to roll. The cube always spins forward to the new value. */
  rollKey?: number;
  /** Extra full turns per roll (2 to 4; use a different value per die). */
  spin?: number;
  /** Edge length as a CSS length. */
  size?: string;
  className?: string;
  label?: string;
}

export default function Dice3D({ value, rollKey = 0, spin = 3, size = "64px", className, label }: Dice3DProps) {
  const [rx0, ry0] = FACE_ROTATION[value] ?? [0, 0];
  const [state, setState] = useState({ key: rollKey, rx: rx0, ry: ry0, air: false });

  // Adjust state while rendering when a roll is requested (keeps running angles; never unwinds).
  if (state.key !== rollKey) {
    const [tx, ty] = FACE_ROTATION[value] ?? [0, 0];
    setState({ key: rollKey, rx: forward(state.rx, tx, spin), ry: forward(state.ry, ty, spin + 1), air: true });
  }

  // Fallback for when no transition runs (reduced motion): clear the in-air state after the roll.
  useEffect(() => {
    if (!state.air) return;
    const id = window.setTimeout(() => setState((s) => ({ ...s, air: false })), 1300);
    return () => window.clearTimeout(id);
  }, [state.air, state.key]);

  return (
    <div
      role="img"
      aria-label={label ?? String(value)}
      className={clsx("die", state.air && "is-air", className)}
      style={{ ["--s" as string]: size, ["--rx" as string]: `${state.rx}deg`, ["--ry" as string]: `${state.ry}deg` }}
    >
      <div className="die-shadow" />
      <div className="die-scene">
        <div className="die-tilt">
          <div
            className="die-cube"
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && state.air) setState((s) => ({ ...s, air: false }));
            }}
          >
            <Faces core />
            <Faces />
          </div>
        </div>
      </div>
    </div>
  );
}
