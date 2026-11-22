// Game sounds, synthesized with the Web Audio API (no audio files). The AudioContext is created and resumed on the
// first user gesture. Master volume about 0.5. The on/off choice is persisted in localStorage.
export type SoundName =
  | "diceRattle"
  | "diceThud"
  | "step"
  | "buy"
  | "gain"
  | "loss"
  | "cardFlip"
  | "jail"
  | "build"
  | "yourTurn"
  | "endTurn"
  | "start"
  | "bankrupt"
  | "offer"
  | "bid"
  | "auctionWon"
  | "mortgage"
  | "unmortgage"
  | "jackpot";

export const SOUND_STORAGE_KEY = "deal-rush:sound";
export const MASTER_VOLUME = 0.5;

type Ctor = new () => AudioContext;

interface Note {
  freq: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  /** End frequency for a glide. */
  to?: number;
}

/** Note lists per sound (times in seconds from the start of the sound). */
const NOTES: Record<Exclude<SoundName, "diceRattle">, Note[]> = {
  diceThud: [{ freq: 110, to: 55, at: 0, dur: 0.14, type: "sine", gain: 0.9 }],
  step: [{ freq: 880, at: 0, dur: 0.05, type: "triangle", gain: 0.25 }],
  buy: [
    { freq: 659, at: 0, dur: 0.12, type: "triangle", gain: 0.5 },
    { freq: 988, at: 0.1, dur: 0.22, type: "triangle", gain: 0.5 },
    { freq: 1760, at: 0.2, dur: 0.1, type: "square", gain: 0.12 },
    { freq: 2349, at: 0.27, dur: 0.12, type: "square", gain: 0.1 },
  ],
  gain: [
    { freq: 1319, at: 0, dur: 0.08, type: "triangle", gain: 0.4 },
    { freq: 1760, at: 0.07, dur: 0.16, type: "triangle", gain: 0.4 },
  ],
  loss: [{ freq: 220, to: 150, at: 0, dur: 0.18, type: "sine", gain: 0.5 }],
  cardFlip: [
    { freq: 500, to: 1200, at: 0, dur: 0.12, type: "sawtooth", gain: 0.12 },
    { freq: 1500, at: 0.1, dur: 0.05, type: "triangle", gain: 0.2 },
  ],
  jail: [
    { freq: 330, to: 250, at: 0, dur: 0.2, type: "square", gain: 0.25 },
    { freq: 250, to: 160, at: 0.2, dur: 0.3, type: "square", gain: 0.25 },
  ],
  build: [
    { freq: 140, to: 90, at: 0, dur: 0.08, type: "square", gain: 0.5 },
    { freq: 140, to: 90, at: 0.14, dur: 0.08, type: "square", gain: 0.5 },
  ],
  yourTurn: [
    { freq: 1047, at: 0, dur: 0.5, type: "sine", gain: 0.35 },
    { freq: 1568, at: 0, dur: 0.5, type: "sine", gain: 0.12 },
  ],
  endTurn: [{ freq: 1200, at: 0, dur: 0.04, type: "triangle", gain: 0.15 }],
  start: [
    { freq: 523, at: 0, dur: 0.14, type: "triangle", gain: 0.4 },
    { freq: 659, at: 0.14, dur: 0.14, type: "triangle", gain: 0.4 },
    { freq: 784, at: 0.28, dur: 0.14, type: "triangle", gain: 0.4 },
    { freq: 1047, at: 0.42, dur: 0.4, type: "triangle", gain: 0.45 },
  ],
  bid: [{ freq: 1500, at: 0, dur: 0.04, type: "square", gain: 0.12 }],
  auctionWon: [
    { freq: 784, at: 0, dur: 0.12, type: "triangle", gain: 0.4 },
    { freq: 988, at: 0.12, dur: 0.12, type: "triangle", gain: 0.4 },
    { freq: 1319, at: 0.24, dur: 0.3, type: "triangle", gain: 0.45 },
  ],
  mortgage: [
    { freq: 300, to: 180, at: 0, dur: 0.07, type: "square", gain: 0.4 },
    { freq: 120, at: 0.09, dur: 0.1, type: "square", gain: 0.35 },
  ],
  unmortgage: [
    { freq: 180, to: 300, at: 0, dur: 0.07, type: "square", gain: 0.35 },
    { freq: 900, at: 0.09, dur: 0.12, type: "triangle", gain: 0.3 },
  ],
  jackpot: [
    { freq: 523, at: 0, dur: 0.1, type: "triangle", gain: 0.4 },
    { freq: 659, at: 0.1, dur: 0.1, type: "triangle", gain: 0.4 },
    { freq: 784, at: 0.2, dur: 0.1, type: "triangle", gain: 0.4 },
    { freq: 1047, at: 0.3, dur: 0.1, type: "triangle", gain: 0.45 },
    { freq: 1319, at: 0.4, dur: 0.1, type: "triangle", gain: 0.45 },
    { freq: 1568, at: 0.5, dur: 0.5, type: "triangle", gain: 0.5 },
  ],
  offer: [
    { freq: 784, at: 0, dur: 0.12, type: "sine", gain: 0.3 },
    { freq: 1175, at: 0.14, dur: 0.22, type: "sine", gain: 0.3 },
  ],
  bankrupt: [
    { freq: 400, to: 300, at: 0, dur: 0.22, type: "sawtooth", gain: 0.25 },
    { freq: 300, to: 200, at: 0.22, dur: 0.22, type: "sawtooth", gain: 0.25 },
    { freq: 200, to: 100, at: 0.44, dur: 0.4, type: "sawtooth", gain: 0.25 },
  ],
};

const defaultCtor = (): Ctor | undefined => {
  if (typeof window === "undefined") return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
};

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private unlocked = false;

  constructor(private readonly getCtor: () => Ctor | undefined = defaultCtor) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off");
    } catch {
      /* storage unavailable */
    }
  }

  /** Reads the saved choice (call once on the client). Returns the loaded value. */
  loadPreference(): boolean {
    try {
      this.enabled = window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
    } catch {
      this.enabled = true;
    }
    return this.enabled;
  }

  /** Browsers only allow audio after a user gesture: create / resume the context on the first one. */
  unlockOnGesture(target: Pick<Document, "addEventListener" | "removeEventListener"> = document): () => void {
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const off = () => events.forEach((e) => target.removeEventListener(e, unlock));
    const unlock = () => {
      this.ensure();
      void this.ctx?.resume?.();
      this.unlocked = true;
      off();
    };
    events.forEach((e) => target.addEventListener(e, unlock, { passive: true } as AddEventListenerOptions));
    return off;
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const C = this.getCtor();
    if (!C) return null;
    try {
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_VOLUME;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  /** Plays a sound; silently does nothing when muted, before the first gesture, or without Web Audio. */
  play(name: SoundName): void {
    if (!this.enabled || !this.unlocked) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (ctx.state === "suspended") void ctx.resume?.();
    const t0 = ctx.currentTime;
    if (name === "diceRattle") return this.rattle(ctx, t0);
    for (const n of NOTES[name]) this.tone(ctx, t0, n);
  }

  private tone(ctx: AudioContext, t0: number, n: Note): void {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(n.freq, t0 + n.at);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t0 + n.at + n.dur);
    const peak = n.gain ?? 0.3;
    amp.gain.setValueAtTime(0.0001, t0 + n.at);
    amp.gain.exponentialRampToValueAtTime(peak, t0 + n.at + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
    osc.connect(amp);
    amp.connect(this.master!);
    osc.start(t0 + n.at);
    osc.stop(t0 + n.at + n.dur + 0.02);
  }

  /** Dice rattle: a few short noise bursts. */
  private rattle(ctx: AudioContext, t0: number): void {
    const len = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    [0, 0.09, 0.17, 0.26, 0.36, 0.5, 0.68].forEach((at, i) => {
      const src = ctx.createBufferSource();
      const amp = ctx.createGain();
      src.buffer = buffer;
      amp.gain.value = 0.35 * (1 - i * 0.09);
      src.connect(amp);
      amp.connect(this.master!);
      src.start(t0 + at);
    });
  }
}

/** The shared instance used by the game. */
export const sound = new SoundEngine();
