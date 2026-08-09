import { describe, it, expect } from "vitest";
import { buildQueryString, resolveGamificationScope, resolveSkillSelect } from "@/lib/api/response-shaping";

describe("response shaping helpers", () => {
  it("produces a compact skill select for dashboard usage", () => {
    expect(resolveSkillSelect(true)).toContain("id,name,description");
    expect(resolveSkillSelect(true)).not.toContain("*");
  });

  it("adds compact flag to a query string without losing other params", () => {
    expect(buildQueryString("category=tech", true)).toBe("?category=tech&compact=true");
    expect(buildQueryString("", true)).toBe("?compact=true");
  });

  it("normalizes gamification scopes", () => {
    expect(resolveGamificationScope("dashboard")).toBe("dashboard");
    expect(resolveGamificationScope("full")).toBe("full");
    expect(resolveGamificationScope(null)).toBe("full");
  });
});
