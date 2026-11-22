// Player character: manifest art (never tinted or filtered) or the temporary original SVG, with a soft shadow.
import clsx from "clsx";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";
import { TEMP_CHARACTERS } from "@/components/characters/temp";
import { characterById } from "@/config/characters";

export type CharacterSize = "xs" | "sm" | "md" | "lg" | "fill";

/** xs: board (about 2.8cqw wide, never under 18px); sm: lists and chat; md: picker cards; lg: picker preview. */
const SIZES: Record<CharacterSize, { css: string; px: number }> = {
  xs: { css: "max(18px, calc(var(--b) * 0.028))", px: 20 },
  sm: { css: "32px", px: 32 },
  md: { css: "72px", px: 72 },
  lg: { css: "120px", px: 120 },
  /** Fills its parent box (used by TokenZone, which sizes the box with container units). */
  fill: { css: "100%", px: 64 },
};

interface Props {
  /** null = nobody chosen yet (dashed placeholder); undefined falls back to the first character. */
  characterId: string | null | undefined;
  size?: CharacterSize;
  mood?: "idle" | "happy";
  /** Plays the 250ms squash-and-settle. */
  bounce?: boolean;
  /** Gentle 3s idle float. */
  float?: boolean;
  /** Soft drop-shadow glow in this color (selected picker card only). */
  glow?: string;
  className?: string;
}

export default function CharacterToken({ characterId, size = "sm", mood = "idle", bounce, float, glow, className }: Props) {
  const t = useTranslations();
  const entry = characterById(characterId ?? undefined);
  const { css, px } = SIZES[size];
  const Temp = TEMP_CHARACTERS[entry.id];
  const name = t(entry.nameKey);

  if (characterId === null) {
    return (
      <span
        aria-hidden="true"
        className={clsx("inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-line text-ink-muted", className)}
        style={{ width: css, height: css }}
      >
        <User size="50%" strokeWidth={1.5} />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={clsx("char relative inline-block shrink-0 align-bottom", float && "char-float", className)}
      style={{ width: css, height: css }}
    >
      <span aria-hidden="true" className="char-shadow" />
      <span
        className={clsx("block size-full", bounce && "char-bounce")}
        style={glow ? { filter: `drop-shadow(0 0 10px color-mix(in srgb, ${glow} 35%, transparent))` } : undefined}
      >
        {entry.source === "art" && entry.file ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/characters/${entry.file}`} alt="" width={px} height={px} loading="eager" className="size-full object-contain" />
        ) : Temp ? (
          <Temp mood={mood} />
        ) : null}
      </span>
    </span>
  );
}
