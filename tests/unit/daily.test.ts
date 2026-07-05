import { describe, it, expect, beforeEach, vi } from "vitest";
import { Daily } from "../../src/daily";
import { MockAdapter } from "../mock-adapter";

describe("Daily", () => {
  let adapter: MockAdapter;
  let daily: Daily;

  beforeEach(() => {
    adapter = new MockAdapter();
    daily = new Daily(adapter);
  });

  it("gives first claim with streak 1", async () => {
    const result = await daily.claim("user1", "guild1");
    expect(result).toHaveProperty("earned", 100);
    if ("streak" in result) expect(result.streak).toBe(1);
  });

  it("increments streak on consecutive days", async () => {
    await daily.claim("user1", "guild1");
    // Simulate 25 hours later
    const record = await adapter.findDaily({ user: "user1", guild: "guild1" });
    if (record) {
      record.lastClaim = Date.now() - 90000000;
      await adapter.upsertDaily({ user: "user1", guild: "guild1" }, record);
    }
    const result = await daily.claim("user1", "guild1");
    if ("streak" in result) expect(result.streak).toBe(2);
  });

  it("resets streak after missing a day", async () => {
    await daily.claim("user1", "guild1");
    const record = await adapter.findDaily({ user: "user1", guild: "guild1" });
    if (record) {
      record.lastClaim = Date.now() - 200000000;
      await adapter.upsertDaily({ user: "user1", guild: "guild1" }, record);
    }
    const result = await daily.claim("user1", "guild1");
    if ("streak" in result) expect(result.streak).toBe(1);
  });

  it("returns cooldown error if already claimed today", async () => {
    await daily.claim("user1", "guild1");
    const result = await daily.claim("user1", "guild1");
    expect(result).toHaveProperty("error", "already_claimed");
    if ("nextIn" in result) expect(result.nextIn).toBeGreaterThan(0);
  });

  it("applies streak bonus", async () => {
    const dailyBonus = new Daily(adapter, { baseReward: 100, streakBonus: 50 });
    await dailyBonus.claim("user1", "guild1");

    const record = await adapter.findDaily({ user: "user1", guild: "guild1" });
    if (record) {
      record.lastClaim = Date.now() - 90000000;
      await adapter.upsertDaily({ user: "user1", guild: "guild1" }, record);
    }
    const result = await dailyBonus.claim("user1", "guild1");
    expect(result).toHaveProperty("earned", 150);
  });

  it("getStreak returns current streak", async () => {
    expect(await daily.getStreak("user1", "guild1")).toBe(0);
    await daily.claim("user1", "guild1");
    expect(await daily.getStreak("user1", "guild1")).toBe(1);
  });

  it("calls logger", async () => {
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
    const loggedDaily = new Daily(adapter, { logger });
    await loggedDaily.claim("user1", "guild1");
    expect(logger.debug).toHaveBeenCalled();
  });
});
