// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SixDigitInput from "@/components/ui/SixDigitInput";

afterEach(cleanup);

const setup = () => {
  const onComplete = vi.fn();
  render(<SixDigitInput onComplete={onComplete} label={(n) => `Digit ${n} of 6`} />);
  const box = (n: number) => screen.getByLabelText(`Digit ${n} of 6`) as HTMLInputElement;
  return { onComplete, box };
};

describe("SixDigitInput", () => {
  it("renders six numeric boxes that stay left-to-right", () => {
    const { box } = setup();
    for (let n = 1; n <= 6; n++) expect(box(n)).toHaveAttribute("inputmode", "numeric");
    expect(screen.getByRole("group")).toHaveAttribute("dir", "ltr");
  });

  it("auto-advances while typing and auto-submits on the 6th digit", () => {
    const { box, onComplete } = setup();
    "12345".split("").forEach((d, i) => {
      fireEvent.change(box(i + 1), { target: { value: d } });
      expect(box(i + 2)).toHaveFocus();
    });
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.change(box(6), { target: { value: "6" } });
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("fills every box on a paste of 6 digits (including leading zeros) and submits", () => {
    const { box, onComplete } = setup();
    fireEvent.paste(box(1), { clipboardData: { getData: () => "004217" } });
    expect([1, 2, 3, 4, 5, 6].map((n) => box(n).value).join("")).toBe("004217");
    expect(onComplete).toHaveBeenCalledWith("004217");
  });

  it("ignores non-digits and pastes with extra characters", () => {
    const { box, onComplete } = setup();
    fireEvent.change(box(1), { target: { value: "a" } });
    expect(box(1).value).toBe("");
    fireEvent.paste(box(1), { clipboardData: { getData: () => " 12 34-56 " } });
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("backspace clears a digit, then moves back to the previous box", () => {
    const { box, onComplete } = setup();
    fireEvent.change(box(1), { target: { value: "1" } });
    fireEvent.change(box(2), { target: { value: "2" } });
    expect(box(3)).toHaveFocus();
    fireEvent.keyDown(box(3), { key: "Backspace" });
    expect(box(2)).toHaveFocus();
    expect(box(2).value).toBe("");
    fireEvent.keyDown(box(2), { key: "Backspace" });
    expect(box(1)).toHaveFocus();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
