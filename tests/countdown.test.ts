import { describe, expect, it } from "vitest";
import { formatCountdown, remainingMs } from "@/lib/countdown";

describe("countdown", () => {
  it("formats m:ss and rounds up so it never shows 0:00 early", () => {
    expect(formatCountdown(120_000)).toBe("2:00");
    expect(formatCountdown(102_000)).toBe("1:42");
    expect(formatCountdown(61_000)).toBe("1:01");
    expect(formatCountdown(9_001)).toBe("0:10");
    expect(formatCountdown(1)).toBe("0:01");
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(-5000)).toBe("0:00");
  });

  it("is clock-skew safe: the server offset corrects a wrong local clock", () => {
    const serverNow = 1_000_000;
    const expiresAt = serverNow + 120_000;
    const localNow = 5_000_000; // the browser clock is far ahead
    const offset = serverNow - localNow;
    expect(remainingMs(expiresAt, offset, localNow)).toBe(120_000);
    expect(remainingMs(expiresAt, offset, localNow + 18_000)).toBe(102_000);
    expect(remainingMs(expiresAt, offset, localNow + 999_000)).toBe(0);
  });
});
