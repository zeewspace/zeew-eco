import { Adapter } from "./adapters/adapter";
import { InventoryItem } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export class Inventory {
  constructor(private adapter: Adapter) {}

  async get(user: string, guild: string): Promise<InventoryItem[]> {
    const record = await this.adapter.findInventory({ user, guild });
    return record?.inventory ?? [];
  }

  async getItem(user: string, guild: string, itemId: string): Promise<InventoryItem | null> {
    const items = await this.get(user, guild);
    return items.find((i) => i.id === itemId) ?? null;
  }

  async add(user: string, guild: string, name: string, item?: string): Promise<InventoryItem> {
    const record = await this.adapter.findInventory({ user, guild });
    const items = record?.inventory ?? [];
    const newItem: InventoryItem = {
      id: generateId(),
      name,
      item: item ?? null,
    };
    items.push(newItem);
    await this.adapter.upsertInventory({ user, guild }, items);
    return newItem;
  }

  async remove(user: string, guild: string, itemId: string): Promise<boolean> {
    const record = await this.adapter.findInventory({ user, guild });
    if (!record) return false;

    const filtered = record.inventory.filter((i) => i.id !== itemId);
    if (filtered.length === record.inventory.length) return false;

    await this.adapter.upsertInventory({ user, guild }, filtered);
    return true;
  }

  async reset(user: string, guild: string): Promise<boolean> {
    await this.adapter.deleteInventory({ user, guild });
    return true;
  }
}
