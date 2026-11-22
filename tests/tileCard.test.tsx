// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import Board from "@/components/board/Board";
import en from "@/messages/en.json";
import { useRoomStore } from "@/store/roomStore";

beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
  useRoomStore.setState({ selectedTile: null });
});

const renderBoard = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <Board interactive players={[]} />
    </NextIntlClientProvider>,
  );

describe("tile info card", () => {
  it("opens on click, closes on Escape and returns focus to the tile", () => {
    renderBoard();
    const tile = screen.getByRole("button", { name: "Buenos Aires, 90 $" });
    expect(tile).toHaveAttribute("aria-haspopup", "dialog");
    expect(tile).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(tile);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "false");
    expect(dialog).toHaveAccessibleName("Buenos Aires");
    expect(tile).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(tile).toHaveFocus();
  });

  it("toggles closed when the same tile is clicked again and keeps one card at a time", () => {
    renderBoard();
    const a = screen.getByRole("button", { name: "Buenos Aires, 90 $" });
    const b = screen.getByRole("button", { name: "Cairo, 150 $" });
    fireEvent.click(a);
    fireEvent.click(b);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    fireEvent.click(b);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
