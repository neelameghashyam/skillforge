import { describe, it, expect } from "vitest";
import { initials, xpForLevel } from "@/lib/utils";

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
});
