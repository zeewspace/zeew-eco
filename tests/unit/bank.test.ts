import { describe, it, expect, beforeEach, vi } from "vitest";
import { Bank } from "../../src/bank";
import { MockAdapter } from "../mock-adapter";

describe("Bank (unit)", () => {
  let adapter: MockAdapter;
  let bank: Bank;

  beforeEach(() => {
    adapter = new MockAdapter();
    bank = new Bank(adapter);
  });

  describe("get", () => {
    it("returns 0 when user has no record", async () => {
      expect(await bank.get("user1", "guild1")).toBe(0);
    });

    it("returns money when user has a record", async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 500);
      expect(await bank.get("user1", "guild1")).toBe(500);
    });
  });

  describe("add", () => {
    it("creates record and returns amount for new user", async () => {
      expect(await bank.add("user1", "guild1", 100)).toBe(100);
    });

    it("adds to existing balance", async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 200);
      expect(await bank.add("user1", "guild1", 150)).toBe(350);
    });
  });

  describe("remove", () => {
    it("returns 0 for non-existent user", async () => {
      expect(await bank.remove("user1", "guild1", 50)).toBe(0);
    });

    it("subtracts from balance", async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 300);
      expect(await bank.remove("user1", "guild1", 100)).toBe(200);
    });

    it("does not go below 0", async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 50);
      expect(await bank.remove("user1", "guild1", 200)).toBe(0);
    });
  });

  describe("reset", () => {
    it("deletes user record", async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 500);
      expect(await bank.reset("user1", "guild1")).toBe(true);
      expect(await adapter.findBank({ user: "user1", guild: "guild1" })).toBeNull();
    });
  });

  describe("deposit", () => {
    it("returns error when economy not found", async () => {
      const result = await bank.deposit("user1", "guild1", 100);
      expect(result).toEqual({ error: "economy_not_found" });
    });

    it("returns error when insufficient funds", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 50);
      const result = await bank.deposit("user1", "guild1", 100);
      expect(result).toEqual({ error: "insufficient_funds" });
    });

    it("transfers money from economy to bank", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 500);
      const result = await bank.deposit("user1", "guild1", 200);

      if ("error" in result) throw new Error("Expected success");
      expect(result.economy).toBe(300);
      expect(result.bank).toBe(200);
    });

    it("creates bank record if none exists", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 500);
      await bank.deposit("user1", "guild1", 100);

      const bankRecord = await adapter.findBank({ user: "user1", guild: "guild1" });
      expect(bankRecord?.money).toBe(100);
    });

    it("adds to existing bank balance", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 500);
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 300);

      const result = await bank.deposit("user1", "guild1", 200);
      if ("error" in result) throw new Error("Expected success");
      expect(result.bank).toBe(500);
      expect(result.economy).toBe(300);
    });
  });

  describe("withdraw", () => {
    it("returns error when bank not found", async () => {
      const result = await bank.withdraw("user1", "guild1", 100);
      expect(result).toEqual({ error: "bank_not_found" });
    });

    it("returns error when insufficient bank funds", async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 50);
      const result = await bank.withdraw("user1", "guild1", 100);
      expect(result).toEqual({ error: "insufficient_funds" });
    });

    it("transfers money from bank to economy", async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 500);
      const result = await bank.withdraw("user1", "guild1", 200);

      if ("error" in result) throw new Error("Expected success");
      expect(result.bank).toBe(300);
      expect(result.economy).toBe(200);
    });

    it("creates money record if none exists", async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 500);
      await bank.withdraw("user1", "guild1", 100);

      const moneyRecord = await adapter.findMoney({ user: "user1", guild: "guild1" });
      expect(moneyRecord?.money).toBe(100);
    });

    it("adds to existing economy balance", async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 500);
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 300);

      const result = await bank.withdraw("user1", "guild1", 200);
      if ("error" in result) throw new Error("Expected success");
      expect(result.economy).toBe(500);
      expect(result.bank).toBe(300);
    });
  });

  describe("leaderboard", () => {
    beforeEach(async () => {
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 500);
      await adapter.upsertBank({ user: "user2", guild: "guild1" }, 1000);
      await adapter.upsertBank({ user: "user3", guild: "guild1" }, 750);
      await adapter.upsertBank({ user: "user4", guild: "guild2" }, 9999);
    });

    it("returns top users sorted by bank balance", async () => {
      const top = await bank.leaderboard("guild1");
      expect(top).toHaveLength(3);
      expect(top[0].user).toBe("user2");
      expect(top[0].money).toBe(1000);
    });

    it("respects limit", async () => {
      const top = await bank.leaderboard("guild1", 1);
      expect(top).toHaveLength(1);
    });
  });

  describe("hooks", () => {
    it("calls onDeposit", async () => {
      const onDeposit = vi.fn();
      const hookedBank = new Bank(adapter, { hooks: { onDeposit } });
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 500);
      await hookedBank.deposit("user1", "guild1", 100);
      expect(onDeposit).toHaveBeenCalledWith("user1", "guild1", 100);
    });

    it("calls onWithdraw", async () => {
      const onWithdraw = vi.fn();
      const hookedBank = new Bank(adapter, { hooks: { onWithdraw } });
      await adapter.upsertBank({ user: "user1", guild: "guild1" }, 500);
      await hookedBank.withdraw("user1", "guild1", 100);
      expect(onWithdraw).toHaveBeenCalledWith("user1", "guild1", 100);
    });
  });

  describe("logger", () => {
    it("calls logger.debug on operations", async () => {
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
      const loggedBank = new Bank(adapter, { logger });
      await loggedBank.add("user1", "guild1", 100);
      expect(logger.debug).toHaveBeenCalled();
    });
  });
});
