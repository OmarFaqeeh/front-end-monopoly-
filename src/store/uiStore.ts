// Zustand store for local UI state (nickname, dialogs, selections).
import { create } from "zustand";

const KEY = "dealrush:nickname";

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

interface UiState {
  nickname: string;
  /** True once the nickname was read from localStorage on the client. */
  hydrated: boolean;
  loadNickname: () => void;
  setNickname: (nickname: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  nickname: "",
  hydrated: false,
  loadNickname: () => set((s) => ({ nickname: s.nickname || read(), hydrated: true })),
  setNickname: (nickname) => {
    set({ nickname, hydrated: true });
    try {
      window.localStorage.setItem(KEY, nickname);
    } catch {
      /* storage unavailable */
    }
  },
}));
