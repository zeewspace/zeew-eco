import { describe, it, expect, beforeEach, vi } from "vitest";
import { Inventory } from "../../src/inventory";
import { MockAdapter } from "../mock-adapter";

describe("Inventory (unit)", () => {
  let adapter: MockAdapter;
  let inv: Inventory;

  beforeEach(() => {
    adapter = new MockAdapter();
    inv = new Inventory(adapter);
  });

  describe("get", () => {
    it("returns empty array when no inventory exists", async () => {
      expect(await inv.get("user1", "guild1")).toEqual([]);
    });

    it("returns items when inventory exists", async () => {
      const items = [{ id: "i1", name: "Sword", item: "r1" }];
      await adapter.upsertInventory({ user: "user1", guild: "guild1" }, items);
      expect(await inv.get("user1", "guild1")).toEqual(items);
    });
  });

  describe("getItem", () => {
    it("returns null when inventory is empty", async () => {
      expect(await inv.getItem("user1", "guild1", "i1")).toBeNull();
    });

    it("returns null when item not found", async () => {
      await adapter.upsertInventory({ user: "user1", guild: "guild1" }, [
        { id: "i1", name: "Sword", item: "r1" },
      ]);
      expect(await inv.getItem("user1", "guild1", "nonexistent")).toBeNull();
    });

    it("returns the matching item", async () => {
      const item = { id: "i1", name: "Sword", item: "r1" };
      await adapter.upsertInventory({ user: "user1", guild: "guild1" }, [item]);
      expect(await inv.getItem("user1", "guild1", "i1")).toEqual(item);
    });
  });

  describe("add", () => {
    it("creates inventory with first item", async () => {
      const item = await inv.add("user1", "guild1", "Sword", "role1");
      expect(item.name).toBe("Sword");
      expect(item.item).toBe("role1");
      expect(item.id).toBeDefined();
    });

    it("appends item to existing inventory", async () => {
      await inv.add("user1", "guild1", "Sword", "role1");
      await inv.add("user1", "guild1", "Shield", "role2");

      const items = await inv.get("user1", "guild1");
      expect(items).toHaveLength(2);
    });

    it("sets item to null when not provided", async () => {
      const item = await inv.add("user1", "guild1", "Channel");
      expect(item.item).toBeNull();
    });
  });

  describe("remove", () => {
    it("returns false when inventory does not exist", async () => {
      expect(await inv.remove("user1", "guild1", "i1")).toBe(false);
    });

    it("returns false when item not found", async () => {
      await inv.add("user1", "guild1", "Sword", "role1");
      expect(await inv.remove("user1", "guild1", "nonexistent")).toBe(false);
    });

    it("removes item and returns true", async () => {
      const item = await inv.add("user1", "guild1", "Sword", "role1");
      expect(await inv.remove("user1", "guild1", item.id)).toBe(true);
      expect(await inv.get("user1", "guild1")).toHaveLength(0);
    });

    it("only removes the specified item", async () => {
      const item1 = await inv.add("user1", "guild1", "Sword", "role1");
      await inv.add("user1", "guild1", "Shield", "role2");

      await inv.remove("user1", "guild1", item1.id);
      const items = await inv.get("user1", "guild1");
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Shield");
    });
  });

  describe("reset", () => {
    it("deletes entire inventory", async () => {
      await inv.add("user1", "guild1", "Sword", "role1");
      await inv.add("user1", "guild1", "Shield", "role2");

      expect(await inv.reset("user1", "guild1")).toBe(true);
      expect(await inv.get("user1", "guild1")).toEqual([]);
    });
  });

  describe("hooks", () => {
    it("calls onItemAdded", async () => {
      const onItemAdded = vi.fn();
      const hookedInv = new Inventory(adapter, { hooks: { onItemAdded } });
      await hookedInv.add("user1", "guild1", "Sword", "role1");
      expect(onItemAdded).toHaveBeenCalledOnce();
      expect(onItemAdded.mock.calls[0][0]).toBe("user1");
      expect(onItemAdded.mock.calls[0][1]).toBe("guild1");
    });

    it("calls onItemRemoved", async () => {
      const onItemRemoved = vi.fn();
      const hookedInv = new Inventory(adapter, { hooks: { onItemRemoved } });
      const item = await hookedInv.add("user1", "guild1", "Sword", "role1");
      await hookedInv.remove("user1", "guild1", item.id);
      expect(onItemRemoved).toHaveBeenCalledWith("user1", "guild1", item.id);
    });
  });

  describe("logger", () => {
    it("calls logger.debug on operations", async () => {
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
      const loggedInv = new Inventory(adapter, { logger });
      await loggedInv.add("user1", "guild1", "Sword");
      expect(logger.debug).toHaveBeenCalled();
    });
  });
});
