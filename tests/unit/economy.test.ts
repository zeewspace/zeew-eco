import { describe, it, expect, beforeEach, vi } from "vitest";
import { Economy } from "../../src/economy";
import { MockAdapter } from "../mock-adapter";

describe("Economy (unit)", () => {
  let adapter: MockAdapter;
  let eco: Economy;

  beforeEach(() => {
    adapter = new MockAdapter();
    eco = new Economy(adapter);
  });

  describe("get", () => {
    it("returns 0 when user has no record", async () => {
      expect(await eco.get("user1", "guild1")).toBe(0);
    });

    it("returns money when user has a record", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 500);
      expect(await eco.get("user1", "guild1")).toBe(500);
    });
  });

  describe("add", () => {
    it("creates record and returns amount for new user", async () => {
      expect(await eco.add("user1", "guild1", 100)).toBe(100);
    });

    it("adds to existing balance", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 200);
      expect(await eco.add("user1", "guild1", 150)).toBe(350);
    });

    it("persists to adapter", async () => {
      await eco.add("user1", "guild1", 100);
      const record = await adapter.findMoney({ user: "user1", guild: "guild1" });
      expect(record?.money).toBe(100);
    });
  });

  describe("remove", () => {
    it("returns 0 for non-existent user", async () => {
      expect(await eco.remove("user1", "guild1", 50)).toBe(0);
    });

    it("subtracts from balance", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 300);
      expect(await eco.remove("user1", "guild1", 100)).toBe(200);
    });

    it("does not go below 0", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 50);
      expect(await eco.remove("user1", "guild1", 200)).toBe(0);
    });
  });

  describe("reset", () => {
    it("deletes user record", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 500);
      expect(await eco.reset("user1", "guild1")).toBe(true);
      expect(await adapter.findMoney({ user: "user1", guild: "guild1" })).toBeNull();
    });
  });

  describe("work", () => {
    it("returns earned amount with cooldown result shape", async () => {
      const result = await eco.work("user1", "guild1", 100);
      expect(result).toHaveProperty("earned");
      if ("earned" in result) {
        expect(result.earned).toBeGreaterThanOrEqual(0);
        expect(result.earned).toBeLessThan(100);
      }
    });

    it("accumulates earnings across multiple works", async () => {
      let total = 0;
      for (let i = 0; i < 10; i++) {
        const result = await eco.work("user1", "guild1", 50);
        if ("earned" in result) total += result.earned;
      }
      expect(await eco.get("user1", "guild1")).toBe(total);
    });
  });

  describe("work with cooldown", () => {
    it("allows work when no cooldown exists", async () => {
      const result = await eco.work("user1", "guild1", 100, { cooldown: 5000 });
      expect(result).toHaveProperty("earned");
    });

    it("blocks work within cooldown period", async () => {
      await eco.work("user1", "guild1", 100, { cooldown: 60000 });
      const result = await eco.work("user1", "guild1", 100, { cooldown: 60000 });
      expect(result).toHaveProperty("error", "cooldown");
      if ("retryIn" in result) {
        expect(result.retryIn).toBeGreaterThan(0);
        expect(result.retryIn).toBeLessThanOrEqual(60000);
      }
    });

    it("allows work after cooldown expires", async () => {
      await adapter.setCooldown("user1", "guild1", "work", Date.now() - 100000);
      const result = await eco.work("user1", "guild1", 100, { cooldown: 5000 });
      expect(result).toHaveProperty("earned");
    });
  });

  describe("transfer", () => {
    beforeEach(async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 500);
      await adapter.upsertMoney({ user: "user2", guild: "guild1" }, 200);
    });

    it("transfers money between users", async () => {
      const result = await eco.transfer("user1", "user2", "guild1", 150);
      if ("error" in result) throw new Error("Expected success");
      expect(result.from).toBe(350);
      expect(result.to).toBe(350);
      expect(result.amount).toBe(150);
    });

    it("returns error when sender not found", async () => {
      const result = await eco.transfer("unknown", "user2", "guild1", 100);
      expect(result).toEqual({ error: "sender_not_found" });
    });

    it("returns error when insufficient funds", async () => {
      const result = await eco.transfer("user1", "user2", "guild1", 1000);
      expect(result).toEqual({ error: "insufficient_funds" });
    });

    it("creates receiver record if none exists", async () => {
      await eco.transfer("user1", "newuser", "guild1", 100);
      expect(await eco.get("newuser", "guild1")).toBe(100);
      expect(await eco.get("user1", "guild1")).toBe(400);
    });
  });

  describe("bulkAdd", () => {
    it("adds money to multiple users", async () => {
      const count = await eco.bulkAdd([
        { user: "user1", guild: "guild1", amount: 100 },
        { user: "user2", guild: "guild1", amount: 200 },
        { user: "user3", guild: "guild1", amount: 300 },
      ]);
      expect(count).toBe(3);
      expect(await eco.get("user1", "guild1")).toBe(100);
      expect(await eco.get("user2", "guild1")).toBe(200);
      expect(await eco.get("user3", "guild1")).toBe(300);
    });
  });

  describe("leaderboard", () => {
    beforeEach(async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 500);
      await adapter.upsertMoney({ user: "user2", guild: "guild1" }, 1000);
      await adapter.upsertMoney({ user: "user3", guild: "guild1" }, 750);
      await adapter.upsertMoney({ user: "user4", guild: "guild2" }, 9999);
    });

    it("returns top users sorted by money descending", async () => {
      const top = await eco.leaderboard("guild1");
      expect(top).toHaveLength(3);
      expect(top[0].user).toBe("user2");
      expect(top[0].money).toBe(1000);
      expect(top[1].user).toBe("user3");
      expect(top[2].user).toBe("user1");
    });

    it("respects limit parameter", async () => {
      const top = await eco.leaderboard("guild1", 2);
      expect(top).toHaveLength(2);
    });

    it("does not include users from other guilds", async () => {
      const top = await eco.leaderboard("guild1");
      expect(top.every((e) => e.guild === "guild1")).toBe(true);
    });
  });

  describe("hooks", () => {
    it("calls onBalanceChange on add", async () => {
      const onBalanceChange = vi.fn();
      const hookedEco = new Economy(adapter, { hooks: { onBalanceChange } });
      await hookedEco.add("user1", "guild1", 100);
      expect(onBalanceChange).toHaveBeenCalledWith("user1", "guild1", 0, 100);
    });

    it("calls onPurchase on buy", async () => {
      const onPurchase = vi.fn();
      const hookedEco = new Economy(adapter, { hooks: { onPurchase } });
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 1000);
      await adapter.upsertStore({ guild: "guild1" }, [
        { id: "i1", name: "Sword", description: "A blade", price: 100, item: null },
      ]);
      await hookedEco.buy("user1", "guild1", "i1");
      expect(onPurchase).toHaveBeenCalledOnce();
    });

    it("calls onTransfer on transfer", async () => {
      const onTransfer = vi.fn();
      const hookedEco = new Economy(adapter, { hooks: { onTransfer } });
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 500);
      await hookedEco.transfer("user1", "user2", "guild1", 100);
      expect(onTransfer).toHaveBeenCalledWith("user1", "user2", "guild1", 100);
    });

    it("calls onWork on work", async () => {
      const onWork = vi.fn();
      const hookedEco = new Economy(adapter, { hooks: { onWork } });
      await hookedEco.work("user1", "guild1", 100);
      expect(onWork).toHaveBeenCalledOnce();
    });
  });

  describe("logger", () => {
    it("calls logger.debug on operations", async () => {
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
      const loggedEco = new Economy(adapter, { logger });
      await loggedEco.add("user1", "guild1", 100);
      expect(logger.debug).toHaveBeenCalled();
    });
  });

  describe("buy", () => {
    beforeEach(async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 1000);
      await adapter.upsertStore({ guild: "guild1" }, [
        { id: "item1", name: "Sword", description: "A sharp sword", price: 100, item: "role123" },
        { id: "item2", name: "Shield", description: "A strong shield", price: 200, item: null },
      ]);
    });

    it("returns error when store not found", async () => {
      const result = await eco.buy("user1", "guild2", "item1");
      expect(result).toEqual({ error: "store_not_found" });
    });

    it("returns error when user not found", async () => {
      const result = await eco.buy("user2", "guild1", "item1");
      expect(result).toEqual({ error: "user_not_found" });
    });

    it("returns error when item not found", async () => {
      const result = await eco.buy("user1", "guild1", "nonexistent");
      expect(result).toEqual({ error: "item_not_found" });
    });

    it("returns error when insufficient funds", async () => {
      await adapter.upsertMoney({ user: "user1", guild: "guild1" }, 50);
      const result = await eco.buy("user1", "guild1", "item1");
      expect(result).toEqual({ error: "insufficient_funds" });
    });

    it("deducts money and adds item to inventory", async () => {
      const result = await eco.buy("user1", "guild1", "item1");
      if ("error" in result) throw new Error("Expected success");

      expect(result.money).toBe(1000);
      expect(result.newMoney).toBe(900);
      expect(result.item.name).toBe("Sword");

      const inv = await adapter.findInventory({ user: "user1", guild: "guild1" });
      expect(inv?.inventory).toHaveLength(1);
      expect(inv?.inventory[0].name).toBe("Sword");
      expect(inv?.inventory[0].item).toBe("role123");
    });

    it("handles item without item field", async () => {
      const result = await eco.buy("user1", "guild1", "item2");
      if ("error" in result) throw new Error("Expected success");

      const inv = await adapter.findInventory({ user: "user1", guild: "guild1" });
      expect(inv?.inventory[0].item).toBeNull();
    });

    it("accumulates inventory items on multiple purchases", async () => {
      await eco.buy("user1", "guild1", "item1");
      await eco.buy("user1", "guild1", "item2");

      const inv = await adapter.findInventory({ user: "user1", guild: "guild1" });
      expect(inv?.inventory).toHaveLength(2);
    });
  });
});
