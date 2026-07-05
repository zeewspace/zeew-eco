import { describe, it, expect, beforeEach } from "vitest";
import { Store } from "../../src/store";
import { MockAdapter } from "../mock-adapter";

describe("Store (unit)", () => {
  let adapter: MockAdapter;
  let store: Store;

  beforeEach(() => {
    adapter = new MockAdapter();
    store = new Store(adapter);
  });

  describe("get", () => {
    it("returns empty array when no store exists", async () => {
      expect(await store.get("guild1")).toEqual([]);
    });

    it("returns items when store exists", async () => {
      const items = [
        { id: "i1", name: "Sword", description: "Sharp", price: 100, item: "r1" },
      ];
      await adapter.upsertStore({ guild: "guild1" }, items);
      expect(await store.get("guild1")).toEqual(items);
    });
  });

  describe("add", () => {
    it("creates store with first item", async () => {
      const item = await store.add("guild1", "Sword", "A sword", 100, "role1");
      expect(item.name).toBe("Sword");
      expect(item.description).toBe("A sword");
      expect(item.price).toBe(100);
      expect(item.item).toBe("role1");
      expect(item.id).toBeDefined();
    });

    it("appends item to existing store", async () => {
      await store.add("guild1", "Sword", "A sword", 100);
      await store.add("guild1", "Shield", "A shield", 200);

      const items = await store.get("guild1");
      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Sword");
      expect(items[1].name).toBe("Shield");
    });

    it("sets item to null when not provided", async () => {
      const item = await store.add("guild1", "Channel", "Private channel", 500);
      expect(item.item).toBeNull();
    });
  });

  describe("remove", () => {
    it("returns false when store does not exist", async () => {
      expect(await store.remove("guild1", "i1")).toBe(false);
    });

    it("returns false when item not found", async () => {
      await store.add("guild1", "Sword", "A sword", 100);
      expect(await store.remove("guild1", "nonexistent")).toBe(false);
    });

    it("removes item and returns true", async () => {
      const item = await store.add("guild1", "Sword", "A sword", 100);
      expect(await store.remove("guild1", item.id)).toBe(true);
      expect(await store.get("guild1")).toHaveLength(0);
    });

    it("only removes the specified item", async () => {
      const item1 = await store.add("guild1", "Sword", "A sword", 100);
      await store.add("guild1", "Shield", "A shield", 200);

      await store.remove("guild1", item1.id);
      const items = await store.get("guild1");
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Shield");
    });
  });

  describe("reset", () => {
    it("deletes entire store", async () => {
      await store.add("guild1", "Sword", "A sword", 100);
      await store.add("guild1", "Shield", "A shield", 200);

      expect(await store.reset("guild1")).toBe(true);
      expect(await store.get("guild1")).toEqual([]);
    });
  });
});
