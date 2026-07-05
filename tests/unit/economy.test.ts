import { describe, it, expect, beforeEach } from "vitest";
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
    it("adds random amount between 0 and maxEarnings", async () => {
      for (let i = 0; i < 20; i++) {
        const earned = await eco.work("user1", "guild1", 100);
        expect(earned).toBeGreaterThanOrEqual(0);
        expect(earned).toBeLessThan(100);
      }
    });

    it("accumulates earnings across multiple works", async () => {
      let total = 0;
      for (let i = 0; i < 10; i++) {
        total += await eco.work("user1", "guild1", 50);
      }
      expect(await eco.get("user1", "guild1")).toBe(total);
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
