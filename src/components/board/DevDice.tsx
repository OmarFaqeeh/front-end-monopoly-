"use client";
// Dev-only: a die pair auto-rotating on two axes (all faces over time), settled values, and a roll button.
import { useState } from "react";
import DicePair from "./DicePair";

export default function DevDice() {
  const [roll, setRoll] = useState<{ key: number; values: [number, number] }>({ key: 0, values: [4, 6] });
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-10 p-10">
      <h1 className="font-heading text-3xl font-semibold text-ink">Dice test (dev only)</h1>
      <section aria-label="auto-rotating">
        <DicePair values={[1, 2]} size="150px" autoRotate />
      </section>
      <section aria-label="settled values" className="flex flex-wrap justify-center gap-6">
        <DicePair values={[1, 2]} size="70px" />
        <DicePair values={[3, 4]} size="70px" />
        <DicePair values={[5, 6]} size="70px" />
      </section>
      <section aria-label="roll" className="flex flex-col items-center gap-4">
        <DicePair values={roll.values} rollKey={roll.key} size="110px" interactive onRequestRoll={() => document.getElementById("roll")?.click()} />
        <button
          type="button"
          id="roll"
          className="rounded-xl border border-line bg-surface-raised px-5 py-2 font-semibold text-ink"
          onClick={() =>
            setRoll((r) => ({ key: r.key + 1, values: [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)] }))
          }
        >
          Roll
        </button>
      </section>
    </main>
  );
}
