// TEMPORARY: replace with real art. Shared bust base for the temporary original characters.
import type { ReactNode } from "react";

export const OUTLINE = "#2a1d14";

export interface TempProps {
  mood?: "idle" | "happy";
}

export interface BaseProps extends TempProps {
  skin: string;
  skinShade: string;
  clothes: string;
  clothesShade: string;
  /** Drawn first (behind the body): hoods, packs, birds. */
  back?: ReactNode;
  /** Drawn over the clothes, before the head: scarves, collars, aprons. */
  body?: ReactNode;
  /** Drawn over the head: hair, hats, glasses. */
  top?: ReactNode;
  /** Drawn last: held items. */
  front?: ReactNode;
  seed?: number;
}

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
export const stroke = S;

export default function Base({ skin, skinShade, clothes, clothesShade, back, body, top, front, mood = "idle", seed = 0 }: BaseProps) {
  const happy = mood === "happy";
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true" focusable="false">
      {back}
      {/* shoulders and chest (rounded bust base) */}
      <path d="M22 200 C22 160 56 144 100 144 C144 144 178 160 178 200 Z" fill={clothes} {...S} />
      <path d="M22 200 C22 176 36 160 56 152 C46 168 44 184 46 200 Z" fill={clothesShade} opacity="0.55" />
      {/* neck */}
      <path d="M86 126 H114 V150 Q100 158 86 150 Z" fill={skinShade} {...S} />
      {body}
      {/* ears and head */}
      <circle cx="53" cy="90" r="10" fill={skin} {...S} />
      <circle cx="147" cy="90" r="10" fill={skin} {...S} />
      <ellipse cx="100" cy="86" rx="47" ry="48" fill={skin} {...S} />
      <path d="M64 108 Q80 132 100 132 Q120 132 136 108 Q128 124 100 126 Q72 124 64 108 Z" fill={skinShade} opacity="0.5" />
      <ellipse cx="78" cy="68" rx="14" ry="8" fill="#fff" opacity="0.22" />
      {/* cheeks */}
      <circle cx="72" cy="104" r="7" fill="#e8756a" opacity="0.35" />
      <circle cx="128" cy="104" r="7" fill="#e8756a" opacity="0.35" />
      {/* eyes with highlights and blinking lids */}
      {[80, 120].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="90" rx="8" ry="10" fill={OUTLINE} />
          <circle cx={x + 2.5} cy="86" r="3.2" fill="#fff" />
          <circle cx={x - 2.5} cy="94" r="1.6" fill="#fff" opacity="0.8" />
          <ellipse
            className="char-eyelid"
            style={{ animationDelay: `${(seed % 5) * 0.7}s`, animationDuration: `${4 + (seed % 3)}s` }}
            cx={x}
            cy="90"
            rx="9.5"
            ry="11.5"
            fill={skin}
          />
        </g>
      ))}
      {/* brows, nose, mouth */}
      <path d="M70 76 Q80 71 90 75 M110 75 Q120 71 130 76" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <path d="M98 100 Q100 104 102 100" fill="none" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {happy ? (
        <>
          <path d="M82 110 Q100 132 118 110 Z" fill="#7a2b2b" {...S} strokeWidth={2.5} />
          <path d="M91 119 Q100 126 109 119 Q100 114 91 119 Z" fill="#e8756a" />
        </>
      ) : (
        <path d="M88 112 Q100 122 112 112" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      )}
      {top}
      {front}
    </svg>
  );
}
