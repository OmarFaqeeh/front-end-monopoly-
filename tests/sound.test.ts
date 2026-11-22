import { beforeEach, describe, expect, it, vi } from "vitest";
import { MASTER_VOLUME, SoundEngine, SOUND_STORAGE_KEY, type SoundName } from "@/lib/sound";

/** Minimal AudioContext double that records what is created and started. */
function fakeAudio() {
  const log = { contexts: 0, oscillators: 0, sources: 0, started: 0, resumed: 0, masterGain: 0 };
  class FakeParam {
    value = 0;
    setValueAtTime = vi.fn();
    exponentialRampToValueAtTime = vi.fn();
  }
  class FakeNode {
    connect(n: unknown) {
      return n;
    }
  }
  class FakeContext {
    currentTime = 0;
    sampleRate = 8000;
    state: "suspended" | "running" = "suspended";
    destination = new FakeNode();
    constructor() {
      log.contexts++;
    }
    resume() {
      log.resumed++;
      this.state = "running";
      return Promise.resolve();
    }
    createGain() {
      const g = Object.assign(new FakeNode(), { gain: new FakeParam() });
      if (log.contexts && !log.masterGain) log.masterGain = -1;
      return g;
    }
    createOscillator() {
      log.oscillators++;
      return Object.assign(new FakeNode(), { type: "sine", frequency: new FakeParam(), start: () => log.started++, stop: vi.fn() });
    }
    createBuffer(_c: number, len: number) {
      return { getChannelData: () => new Float32Array(len) };
    }
    createBufferSource() {
      log.sources++;
      return Object.assign(new FakeNode(), { buffer: null, start: () => log.started++ });
    }
  }
  return { log, Ctor: FakeContext as unknown as new () => AudioContext };
}

const ALL: SoundName[] = ["diceRattle", "diceThud", "step", "buy", "gain", "loss", "cardFlip", "jail", "build", "yourTurn", "endTurn", "start", "bankrupt", "offer", "bid", "auctionWon", "mortgage", "unmortgage", "jackpot"];

function fakeDocument() {
  const handlers = new Map<string, () => void>();
  return {
    addEventListener: (e: string, h: () => void) => void handlers.set(e, h),
    removeEventListener: (e: string) => void handlers.delete(e),
    fire: (e: string) => handlers.get(e)?.(),
    count: () => handlers.size,
  };
}

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("window", { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } });
});

describe("SoundEngine", () => {
  it("creates no AudioContext and makes no sound before the first user gesture", () => {
    const { log, Ctor } = fakeAudio();
    const engine = new SoundEngine(() => Ctor);
    ALL.forEach((s) => engine.play(s));
    expect(log.contexts).toBe(0);
    expect(log.started).toBe(0);
  });

  it("unlocks on the first gesture (creates and resumes the context) and removes its listeners", () => {
    const { log, Ctor } = fakeAudio();
    const engine = new SoundEngine(() => Ctor);
    const doc = fakeDocument();
    engine.unlockOnGesture(doc as never);
    expect(doc.count()).toBe(3);
    doc.fire("pointerdown");
    expect(log.contexts).toBe(1);
    expect(log.resumed).toBeGreaterThanOrEqual(1);
    expect(doc.count()).toBe(0);
  });

  it("plays every named sound with Web Audio nodes (no audio files)", () => {
    const { log, Ctor } = fakeAudio();
    const engine = new SoundEngine(() => Ctor);
    engine.unlockOnGesture(fakeDocument() as never);
    // unlock by hand through a gesture-less path: use the document double
    const doc = fakeDocument();
    engine.unlockOnGesture(doc as never);
    doc.fire("keydown");
    for (const name of ALL) {
      const before = log.started;
      engine.play(name);
      expect(log.started, name).toBeGreaterThan(before);
    }
    expect(log.oscillators).toBeGreaterThan(10);
    expect(log.sources).toBeGreaterThan(0); // the dice rattle uses noise bursts
  });

  it("is silent when switched off, and remembers the choice in localStorage", () => {
    const { log, Ctor } = fakeAudio();
    const engine = new SoundEngine(() => Ctor);
    const doc = fakeDocument();
    engine.unlockOnGesture(doc as never);
    doc.fire("pointerdown");
    engine.setEnabled(false);
    engine.play("buy");
    expect(log.started).toBe(0);
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe("off");

    const again = new SoundEngine(() => Ctor);
    expect(again.loadPreference()).toBe(false);
    engine.setEnabled(true);
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe("on");
    expect(new SoundEngine(() => Ctor).loadPreference()).toBe(true);
  });

  it("does nothing (and does not throw) without Web Audio", () => {
    const engine = new SoundEngine(() => undefined);
    const doc = fakeDocument();
    engine.unlockOnGesture(doc as never);
    doc.fire("pointerdown");
    expect(() => ALL.forEach((s) => engine.play(s))).not.toThrow();
  });

  it("uses a master volume of about 0.5", () => {
    expect(MASTER_VOLUME).toBe(0.5);
  });
});
