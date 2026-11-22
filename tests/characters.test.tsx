// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import { TEMP_CHARACTERS } from "@/components/characters/temp";
import ColorPicker from "@/components/room/ColorPicker";
import PlayersCard from "@/components/room/PlayersCard";
import { CHARACTERS, accentColor, nearestPlayerToken } from "@/config/characters";
import en from "@/messages/en.json";
import { useRoomStore } from "@/store/roomStore";

afterEach(() => {
  cleanup();
  useRoomStore.setState({ players: [], draftCharacter: null, stage: "pickCharacter", nickname: "Omar", meId: null });
});

const wrap = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={en}>
    {ui}
  </NextIntlClientProvider>
);

describe("character manifest", () => {
  it("has unique ids and each entry resolves to an image or a temp component", () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CHARACTERS) {
      if (c.source === "temp") expect(TEMP_CHARACTERS[c.id], c.id).toBeTruthy();
      else expect(c.file, c.id).toBeTruthy();
      expect((en as unknown as { room: { characters: Record<string, string> } }).room.characters[c.id]).toBeTruthy();
    }
  });

  it("gives every character its own color from the manifest", () => {
    const colors = new Set<string>();
    for (const c of CHARACTERS) {
      expect(c.color, c.id).toMatch(/^#[0-9a-f]{6}$/i);
      expect(accentColor(c.id)).toBe(c.color);
      colors.add(c.color.toLowerCase());
      const n = nearestPlayerToken(c.dominantColor);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(12);
    }
    expect(colors.size).toBe(CHARACTERS.length); // no two characters share a color
  });
});

describe("character picker", () => {
  it("renders every character, enables Join room on selection and disables taken characters", () => {
    useRoomStore.setState({ players: [{ id: "bot", nickname: "Bot", characterId: "c03", isHost: true }], meId: null });
    render(wrap(<ColorPicker />));
    expect(screen.getByRole("heading", { name: "Choose your character" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(CHARACTERS.length);
    expect(screen.queryByText(/color/i)).toBeNull();

    const join = screen.getByRole("button", { name: /Join room/ });
    expect(join).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Character 3, Taken/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "Character 2" }));
    expect(screen.getByRole("radio", { name: "Character 2" })).toHaveAttribute("aria-checked", "true");
    expect(join).toBeEnabled();
  });
});

describe("legacy state", () => {
  it("does not crash on the old colorId shape and never shows the old UI", () => {
    useRoomStore.setState({ players: [{ id: "me", nickname: "Old", color: 3, isHost: true } as never] });
    render(wrap(<PlayersCard />));
    expect(screen.getByText("Old")).toBeInTheDocument();
    expect(screen.getAllByRole("img")[0]).toHaveAccessibleName(/Character 1/);
  });
});
