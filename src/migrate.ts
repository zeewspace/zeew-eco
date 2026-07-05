import { Adapter } from "./adapters/adapter";

interface MongoEcoDoc {
  user: string;
  guild: string;
  money: number;
}

interface MongoStoreDoc {
  guild: string;
  store: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    item?: string | null;
  }>;
}

interface MongoInventoryDoc {
  user: string;
  guild: string;
  inventory: Array<{
    id: string;
    name: string;
    item?: string | null;
  }>;
}

interface MongoBankDoc {
  user: string;
  guild: string;
  money: number;
}

export interface MigrationData {
  economy?: MongoEcoDoc[];
  stores?: MongoStoreDoc[];
  inventory?: MongoInventoryDoc[];
  bank?: MongoBankDoc[];
}

export interface MigrationResult {
  economy: number;
  stores: number;
  inventory: number;
  bank: number;
}

/**
 * Migrate data from MongoDB (zeew-eco v1.x) to any v3 Adapter.
 *
 * Export your MongoDB collections as JSON arrays and pass them here:
 *
 * ```ts
 * import { JsonAdapter, migrateFromV1 } from "zeew-eco";
 *
 * const data: MigrationData = {
 *   economy: require("./export-economia.json"),
 *   stores: require("./export-store.json"),
 *   inventory: require("./export-inventory.json"),
 *   bank: require("./export-banco.json"),
 * };
 *
 * const adapter = new JsonAdapter("./migrated.json");
 * const result = await migrateFromV1(adapter, data);
 * // { economy: 150, stores: 3, inventory: 89, bank: 42 }
 * ```
 */
export async function migrateFromV1(
  adapter: Adapter,
  data: MigrationData
): Promise<MigrationResult> {
  const result: MigrationResult = { economy: 0, stores: 0, inventory: 0, bank: 0 };

  if (data.economy) {
    for (const doc of data.economy) {
      await adapter.upsertMoney({ user: doc.user, guild: doc.guild }, doc.money);
      result.economy++;
    }
  }

  if (data.stores) {
    for (const doc of data.stores) {
      const items = doc.store.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        price: item.price,
        item: item.item ?? null,
      }));
      await adapter.upsertStore({ guild: doc.guild }, items);
      result.stores++;
    }
  }

  if (data.inventory) {
    for (const doc of data.inventory) {
      const items = doc.inventory.map((item) => ({
        id: item.id,
        name: item.name,
        item: item.item ?? null,
      }));
      await adapter.upsertInventory({ user: doc.user, guild: doc.guild }, items);
      result.inventory++;
    }
  }

  if (data.bank) {
    for (const doc of data.bank) {
      await adapter.upsertBank({ user: doc.user, guild: doc.guild }, doc.money);
      result.bank++;
    }
  }

  return result;
}
