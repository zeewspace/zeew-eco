import { describe, it, expect, beforeEach, vi } from "vitest";
import { Badges } from "../../src/badges";
import { MockAdapter } from "../mock-adapter";

describe("Badges", () => {
  let adapter: MockAdapter;
  let badges: Badges;

  beforeEach(() => {
    adapter = new MockAdapter();
    badges = new Badges(adapter);
  });

  it("defines a badge", async () => {
    const badge = await badges.define("guild1", "first-buy", "First Purchase", "Made your first buy", "🛒");
    expect(badge.id).toBe("first-buy");
    expect(badge.name).toBe("First Purchase");
    expect(badge.icon).toBe("🛒");
  });

  it("lists badge definitions", async () => {
    await badges.define("guild1", "b1", "Badge 1", "Desc 1");
    await badges.define("guild1", "b2", "Badge 2", "Desc 2");
    const list = await badges.list("guild1");
    expect(list).toHaveLength(2);
  });

  it("awards a badge to user", async () => {
    await badges.define("guild1", "first-buy", "First Purchase", "Desc");
    const result = await badges.award("user1", "guild1", "first-buy");
    expect(result).toHaveProperty("badgeId", "first-buy");
    expect(result).toHaveProperty("awardedAt");
  });

  it("returns error for unknown badge", async () => {
    const result = await badges.award("user1", "guild1", "nonexistent");
    expect(result).toEqual({ error: "badge_not_found" });
  });

  it("returns error for duplicate award", async () => {
    await badges.define("guild1", "b1", "Badge", "Desc");
    await badges.award("user1", "guild1", "b1");
    const result = await badges.award("user1", "guild1", "b1");
    expect(result).toEqual({ error: "already_awarded" });
  });

  it("checks if user has badge", async () => {
    await badges.define("guild1", "b1", "Badge", "Desc");
    expect(await badges.has("user1", "guild1", "b1")).toBe(false);
    await badges.award("user1", "guild1", "b1");
    expect(await badges.has("user1", "guild1", "b1")).toBe(true);
  });

  it("counts user badges", async () => {
    await badges.define("guild1", "b1", "Badge 1", "Desc");
    await badges.define("guild1", "b2", "Badge 2", "Desc");
    await badges.award("user1", "guild1", "b1");
    await badges.award("user1", "guild1", "b2");
    expect(await badges.count("user1", "guild1")).toBe(2);
  });

  it("removes a badge from user", async () => {
    await badges.define("guild1", "b1", "Badge", "Desc");
    await badges.award("user1", "guild1", "b1");
    expect(await badges.remove("user1", "guild1", "b1")).toBe(true);
    expect(await badges.has("user1", "guild1", "b1")).toBe(false);
  });

  it("undefines a badge", async () => {
    await badges.define("guild1", "b1", "Badge", "Desc");
    await badges.undefine("guild1", "b1");
    const list = await badges.list("guild1");
    expect(list).toHaveLength(0);
  });

  it("calls logger", async () => {
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
    const loggedBadges = new Badges(adapter, { logger });
    await loggedBadges.define("guild1", "b1", "Badge", "Desc");
    expect(logger.debug).toHaveBeenCalled();
  });
});
