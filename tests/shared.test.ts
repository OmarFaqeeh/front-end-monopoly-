import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("shared copies", () => {
  it("src/shared is identical to the repository-root shared/ folder", () => {
    const script = path.resolve(import.meta.dirname, "../../scripts/sync-shared.mjs");
    expect(() => execFileSync(process.execPath, [script, "--check"], { stdio: "pipe" })).not.toThrow();
  });
});
