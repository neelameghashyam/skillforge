import { describe, it, expect } from "vitest";
import { levelFromXp, xpFloorForLevel, getLevelInfo } from "@/lib/gamification/levels";

describe("gamification level curve", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it("computes level floor consistently with levelFromXp", () => {
    for (let level = 1; level <= 20; level++) {
      const floor = xpFloorForLevel(level);
      expect(levelFromXp(floor)).toBe(level);
    }
  });

  it("computes progress percentage within a level", () => {
    const info = getLevelInfo(xpFloorForLevel(3));
    expect(info.level).toBe(3);
    expect(info.progressPct).toBe(0);
  });

  it("never returns a level below 1 for negative XP", () => {
    expect(levelFromXp(-100)).toBe(1);
  });
});
