// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

const sendChatMessage = vi.fn();
vi.mock("@/lib/roomClient", () => ({ sendChatMessage: (...a: unknown[]) => sendChatMessage(...a) }));

import ChatPanel from "@/components/room/ChatPanel";
import { useRoomStore } from "@/store/roomStore";

const msg = (id: string, playerId: string, name: string, text: string, at = Date.UTC(2026, 0, 1, 14, 5)) => ({ id, playerId, name, characterId: "c01", text, at });

beforeEach(() => {
  sendChatMessage.mockReset();
  useRoomStore.setState({ messages: [], meId: "me", stage: "lobby" });
});
afterEach(cleanup);

const renderChat = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ChatPanel />
    </NextIntlClientProvider>,
  );

describe("chat store", () => {
  it("ignores a message whose id is already there (broadcast + ack)", () => {
    useRoomStore.getState().addMessage(msg("1", "me", "Omar", "hi"));
    useRoomStore.getState().addMessage(msg("1", "me", "Omar", "hi"));
    expect(useRoomStore.getState().messages).toHaveLength(1);
  });
});

describe("ChatPanel", () => {
  it("shows framed bubbles with the sender's name (others only) and the time", () => {
    useRoomStore.setState({ messages: [msg("1", "other", "Sara", "hello"), msg("2", "me", "Omar", "hey there")] });
    const { container } = renderChat();
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("Sara")).toBeInTheDocument();
    expect(screen.queryByText("Omar")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".chat-bubble")).toHaveLength(2);
    expect(container.querySelectorAll(".chat-bubble.is-mine")).toHaveLength(1);
    expect(container.querySelectorAll("time")).toHaveLength(2);
  });

  it("sends through the socket client, clears the input, and shows a rate-limit message", async () => {
    sendChatMessage.mockResolvedValueOnce(null).mockResolvedValueOnce("RATE_LIMITED");
    renderChat();
    const input = screen.getByPlaceholderText("Write a message") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  first " } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledWith("first"));
    await waitFor(() => expect(input.value).toBe(""));

    fireEvent.change(input, { target: { value: "second" } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("too fast");
    expect(input.value).toBe("second");
  });

  it("shows system lines from event codes in a muted style, with tile names and amounts", () => {
    useRoomStore.setState({
      messages: [
        { id: "s1", playerId: "system", name: "", characterId: null, text: "", at: 1, system: { code: "bought", params: { name: "Omar", tileIndex: 6, amount: 90 } } },
        { id: "s2", playerId: "system", name: "", characterId: null, text: "", at: 2, system: { code: "rent", params: { from: "Sara", to: "Omar", amount: 30 } } },
        { id: "s3", playerId: "system", name: "", characterId: null, text: "", at: 3, system: { code: "card", params: { name: "Sara", deck: "vault" } } },
        { id: "s4", playerId: "system", name: "", characterId: null, text: "", at: 4, system: { code: "builtHotel", params: { name: "Omar", tileIndex: 6 } } },
        { id: "s5", playerId: "system", name: "", characterId: null, text: "", at: 5, system: { code: "start", params: { name: "Omar", amount: 200 } } },
      ],
    });
    const { container } = renderChat();
    expect(screen.getByText("Omar bought Patagonia for 90 $")).toBeInTheDocument();
    expect(screen.getByText("Sara paid 30 $ rent to Omar")).toBeInTheDocument();
    expect(screen.getByText("Sara drew a vault card")).toBeInTheDocument();
    expect(screen.getByText("Omar built a hotel on Patagonia")).toBeInTheDocument();
    expect(screen.getByText("Omar collected 200 $ for passing Start")).toBeInTheDocument();
    expect(container.querySelectorAll(".chat-bubble")).toHaveLength(0);
    expect(container.querySelector("[data-system='bought']")).toHaveClass("text-ink-muted");
  });

  it("is disabled until the player has joined the lobby", () => {
    useRoomStore.setState({ stage: "pickCharacter" });
    renderChat();
    expect(screen.getByPlaceholderText("Join the room to chat")).toBeDisabled();
  });
});
