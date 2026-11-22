// A player's picture with a soft, translucent glow of the player's own color coming out from behind it.
import { accentColor } from "@/config/characters";
import CharacterToken, { type CharacterSize } from "./CharacterToken";

export default function PlayerAvatar({ characterId, size = "sm" }: { characterId: string | null | undefined; size?: CharacterSize }) {
  const color = characterId ? accentColor(characterId) : undefined;
  return (
    <span
      data-avatar-glow={color ?? ""}
      className="player-avatar relative inline-flex shrink-0 items-center justify-center rounded-full p-1"
      style={color ? { ["--c" as string]: color } : undefined}
    >
      <CharacterToken characterId={characterId} size={size} />
    </span>
  );
}
