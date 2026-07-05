import { describe, it, expect, beforeEach } from "vitest";
import { migrateFromV1, MigrationData } from "../../src/migrate";
import { MockAdapter } from "../mock-adapter";

describe("migrateFromV1", () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  it("migrates economy data", async () => {
    const data: MigrationData = {
      economy: [
        { user: "u1", guild: "g1", money: 100 },
        { user: "u2", guild: "g1", money: 200 },
      ],
    };

    const result = await migrateFromV1(adapter, data);

    expect(result.economy).toBe(2);
    expect(await adapter.findMoney({ user: "u1", guild: "g1" })).toEqual({ user: "u1", guild: "g1", money: 100 });
    expect(await adapter.findMoney({ user: "u2", guild: "g1" })).toEqual({ user: "u2", guild: "g1", money: 200 });
  });

  it("migrates store data", async () => {
    const data: MigrationData = {
      stores: [
        {
          guild: "g1",
          store: [
            { id: "i1", name: "Sword", description: "A blade", price: 100, item: "role1" },
            { id: "i2", name: "Shield", price: 200 },
          ],
        },
      ],
    };

    const result = await migrateFromV1(adapter, data);

    expect(result.stores).toBe(1);
    const store = await adapter.findStore({ guild: "g1" });
    expect(store?.items).toHaveLength(2);
    expect(store?.items[0].name).toBe("Sword");
    expect(store?.items[1].description).toBe("");
  });

  it("migrates inventory data", async () => {
    const data: MigrationData = {
      inventory: [
        {
          user: "u1",
          guild: "g1",
          inventory: [
            { id: "i1", name: "Potion", item: "hp" },
          ],
        },
      ],
    };

    const result = await migrateFromV1(adapter, data);

    expect(result.inventory).toBe(1);
    const inv = await adapter.findInventory({ user: "u1", guild: "g1" });
    expect(inv?.inventory[0].name).toBe("Potion");
  });

  it("migrates bank data", async () => {
    const data: MigrationData = {
      bank: [
        { user: "u1", guild: "g1", money: 500 },
      ],
    };

    const result = await migrateFromV1(adapter, data);

    expect(result.bank).toBe(1);
    expect(await adapter.findBank({ user: "u1", guild: "g1" })).toEqual({ user: "u1", guild: "g1", money: 500 });
  });

  it("migrates all collections at once", async () => {
    const data: MigrationData = {
      economy: [{ user: "u1", guild: "g1", money: 100 }],
      stores: [{ guild: "g1", store: [{ id: "i1", name: "Item", description: "Desc", price: 50 }] }],
      inventory: [{ user: "u1", guild: "g1", inventory: [{ id: "i1", name: "Item" }] }],
      bank: [{ user: "u1", guild: "g1", money: 200 }],
    };

    const result = await migrateFromV1(adapter, data);

    expect(result).toEqual({ economy: 1, stores: 1, inventory: 1, bank: 1 });
  });

  it("handles empty data gracefully", async () => {
    const result = await migrateFromV1(adapter, {});
    expect(result).toEqual({ economy: 0, stores: 0, inventory: 0, bank: 0 });
  });

  it("handles missing optional fields in store items", async () => {
    const data: MigrationData = {
      stores: [
        {
          guild: "g1",
          store: [{ id: "i1", name: "Item", price: 10 }],
        },
      ],
    };

    const result = await migrateFromV1(adapter, data);
    expect(result.stores).toBe(1);

    const store = await adapter.findStore({ guild: "g1" });
    expect(store?.items[0].description).toBe("");
    expect(store?.items[0].item).toBeNull();
  });
});
