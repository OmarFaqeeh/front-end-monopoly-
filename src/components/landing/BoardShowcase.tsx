// Board showcase: text on the start side, an original decorative SVG board with orbiting tokens.
import { getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

const SIZE = 600;
const PAD = 12;
const CORNER = 62;
const SIDE_LEN = (SIZE - 2 * PAD - 2 * CORNER) / 9; // 9 tiles per side, 40 in total
const BAND = 14;

// Color group (1 to 8) or "" for a neutral tile, per side of the ring (decorative only).
const SIDES: string[][] = [
  ["1", "", "1", "", "", "2", "", "2", "2"],
  ["3", "", "3", "3", "", "4", "", "4", "4"],
  ["5", "", "5", "5", "", "6", "", "6", "6"],
  ["7", "", "7", "", "7", "", "8", "", "8"],
];

const TOKENS = [
  { n: 1, dur: "46s", delay: "0s", at: [43, 43] },
  { n: 2, dur: "58s", delay: "-21s", at: [557, 43] },
  { n: 3, dur: "52s", delay: "-33s", at: [557, 557] },
] as const;

function Diamond({ x, y, s, className }: { x: number; y: number; s: number; className?: string }) {
  return <path d={`M${x} ${y - s} L${x + s} ${y} L${x} ${y + s} L${x - s} ${y} Z`} className={className} />;
}

/** One side of the ring drawn along the bottom edge (rotated into place by the caller). */
function Side({ groups }: { groups: string[] }) {
  const top = SIZE - PAD - CORNER;
  return (
    <>
      {groups.map((g, i) => {
        const x = SIZE - PAD - CORNER - (i + 1) * SIDE_LEN;
        return (
          <g key={i}>
            <rect x={x} y={top} width={SIDE_LEN} height={CORNER} fill="var(--surface-raised)" stroke="var(--line)" />
            {g ? (
              <rect x={x + 0.5} y={top + 0.5} width={SIDE_LEN - 1} height={BAND} fill={`var(--group-${g})`} />
            ) : (
              <Diamond x={x + SIDE_LEN / 2} y={top + CORNER / 2} s={5} className="fill-accent opacity-60" />
            )}
          </g>
        );
      })}
    </>
  );
}

function Corner() {
  const x = SIZE - PAD - CORNER;
  const cx = x + CORNER / 2;
  return (
    <g>
      <rect x={x} y={x} width={CORNER} height={CORNER} fill="var(--surface-sunken)" stroke="var(--line)" />
      <circle cx={cx} cy={cx} r="16" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.8" />
      <Diamond x={cx} y={cx} s={6} className="fill-accent" />
    </g>
  );
}

export default async function BoardShowcase() {
  const t = await getTranslations("landing");
  const mark = t("wordmark.latin");

  return (
    <Section id="board" tone="surface">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeader align="start" eyebrow={t("board.eyebrow")} title={t("board.title")} />
          <Reveal index={2}>
            <p className="-mt-6 max-w-[48ch] text-lg leading-relaxed text-ink-muted">{t("board.body")}</p>
          </Reveal>
        </div>

        <Reveal index={1}>
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="mx-auto w-full max-w-[520px] drop-shadow-[0_18px_40px_rgb(0_0_0/0.18)]"
          >
            <defs>
              <pattern id="board-center-lattice" width="48" height="48" patternUnits="userSpaceOnUse">
                <g fill="none" stroke="var(--ink-muted)" strokeWidth="0.8" opacity="0.35">
                  <path d="M24 6 L30 18 L42 24 L30 30 L24 42 L18 30 L6 24 L18 18 Z" />
                </g>
              </pattern>
            </defs>

            <rect x="3" y="3" width={SIZE - 6} height={SIZE - 6} rx="28" fill="var(--surface-raised)" stroke="var(--accent)" strokeWidth="1.5" />
            <rect x={PAD + CORNER} y={PAD + CORNER} width={SIZE - 2 * (PAD + CORNER)} height={SIZE - 2 * (PAD + CORNER)} fill="url(#board-center-lattice)" />
            <rect x="112" y="112" width={SIZE - 224} height={SIZE - 224} rx="10" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />

            {[0, 90, 180, 270].map((deg, i) => (
              <g key={deg} transform={`rotate(${deg} ${SIZE / 2} ${SIZE / 2})`}>
                <Side groups={SIDES[i] ?? []} />
                <Corner />
              </g>
            ))}

            <text
              x={SIZE / 2}
              y={SIZE / 2 + 6}
              textAnchor="middle"
              className="font-heading"
              fontSize="44"
              fontWeight="600"
              letterSpacing={6}
              fill="var(--accent)"
            >
              {mark}
            </text>
            <line x1="236" y1="332" x2="364" y2="332" stroke="var(--accent)" strokeWidth="1" opacity="0.7" />
            <Diamond x={300} y={332} s={4} className="fill-accent" />

            {TOKENS.map(({ n, dur, delay, at }) => (
              <g
                key={n}
                className="board-token"
                style={{ transform: `translate(${at[0]}px, ${at[1]}px)`, ["--dur" as string]: dur, ["--delay" as string]: delay }}
              >
                <circle r="14" fill="none" stroke={`var(--player-${n})`} strokeWidth="1.5" opacity="0.45" />
                <circle r="9" fill={`var(--player-${n})`} stroke="var(--surface-raised)" strokeWidth="3" />
              </g>
            ))}
          </svg>
        </Reveal>
      </div>
    </Section>
  );
}
