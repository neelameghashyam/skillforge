import { describe, it, expect } from "vitest";
import { initials, xpForLevel, nowIsoString, getErrorMessage } from "@/lib/utils";

describe("utils", () => {
  it("computes initials from a full name", () => {
    expect(initials("Jane Doe")).toBe("JD");
    expect(initials(null)).toBe("U");
    expect(initials("Cher")).toBe("C");
  });

  it("computes xp required for a level", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(50);
  });

  it("returns a shared ISO timestamp for current time", () => {
    const value = nowIsoString();
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("normalizes error-like values into a readable message", () => {
    expect(getErrorMessage(new Error("Boom"))).toBe("Boom");
    expect(getErrorMessage("Custom error")).toBe("Custom error");
    expect(getErrorMessage(undefined, "Fallback")).toBe("Fallback");
  });
});
