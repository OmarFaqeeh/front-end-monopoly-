// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

const push = vi.fn();
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
const createRoom = vi.fn();
vi.mock("@/lib/api", async (orig) => ({ ...(await orig<typeof import("@/lib/api")>()), createRoom: (...a: unknown[]) => createRoom(...a) }));

import { ApiError } from "@/lib/api";
import NicknameForm from "@/components/hero/NicknameForm";
import { useUiStore } from "@/store/uiStore";

const renderForm = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <NicknameForm />
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  push.mockClear();
  createRoom.mockReset();
  window.sessionStorage.clear();
  window.localStorage.clear();
  useUiStore.setState({ nickname: "", hydrated: true });
});
afterEach(cleanup);

const input = () => screen.getByPlaceholderText("Your nickname") as HTMLInputElement;
const type = (v: string) => fireEvent.change(input(), { target: { value: v } });

describe("landing: Play validates the nickname", () => {
  it("shows an inline error and does not navigate for an invalid nickname", () => {
    renderForm();
    type("   ");
    fireEvent.click(screen.getByRole("button", { name: /Play now/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Use 1 to 16 letters");
    expect(push).not.toHaveBeenCalled();
    type("bad<name>");
    fireEvent.click(screen.getByRole("button", { name: /Play now/ }));
    expect(push).not.toHaveBeenCalled();
    type("x".repeat(17));
    fireEvent.click(screen.getByRole("button", { name: /Play now/ }));
    expect(push).not.toHaveBeenCalled();
  });

  it("goes to /play with a valid nickname (any language) and stores it", () => {
    renderForm();
    type("  عمر 1 ");
    fireEvent.click(screen.getByRole("button", { name: /Play now/ }));
    expect(push).toHaveBeenCalledWith("/play");
    expect(useUiStore.getState().nickname).toBe("عمر 1");
  });
});

describe("landing: Create private room", () => {
  it("validates first, then creates the room and opens it with stored credentials", async () => {
    createRoom.mockResolvedValue({ code: "004217", playerId: "p-1", playerToken: "tok-1", expiresAt: 1, serverNow: 0 });
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /Create a private room/ }));
    expect(createRoom).not.toHaveBeenCalled();
    type("Omar");
    fireEvent.click(screen.getByRole("button", { name: /Create a private room/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/room/004217"));
    expect(createRoom).toHaveBeenCalledWith("Omar");
    expect(JSON.parse(window.sessionStorage.getItem("deal-rush:room:004217")!)).toEqual({ playerId: "p-1", playerToken: "tok-1" });
  });

  it("shows a translated error when the server cannot be reached", async () => {
    createRoom.mockRejectedValue(new ApiError("NETWORK_ERROR"));
    renderForm();
    type("Omar");
    fireEvent.click(screen.getByRole("button", { name: /Create a private room/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
    expect(push).not.toHaveBeenCalled();
  });
});
