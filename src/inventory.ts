import { Adapter } from "./adapters/adapter";
import { InventoryItem, InventoryOptions } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export class Inventory {
  private adapter: Adapter;
  private hooks;
  private logger;

  constructor(adapter: Adapter, options?: InventoryOptions) {
    this.adapter = adapter;
    this.hooks = options?.hooks;
    this.logger = options?.logger;
  }

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
    this.logger?.debug(`[Inventory] added "${name}" to ${user}@${guild}`);
    this.hooks?.onItemAdded?.(user, guild, newItem);
    return newItem;
  }

  async remove(user: string, guild: string, itemId: string): Promise<boolean> {
    const record = await this.adapter.findInventory({ user, guild });
    if (!record) return false;

    const filtered = record.inventory.filter((i) => i.id !== itemId);
    if (filtered.length === record.inventory.length) return false;

    await this.adapter.upsertInventory({ user, guild }, filtered);
    this.logger?.debug(`[Inventory] removed item ${itemId} from ${user}@${guild}`);
    this.hooks?.onItemRemoved?.(user, guild, itemId);
    return true;
  }

  async reset(user: string, guild: string): Promise<boolean> {
    await this.adapter.deleteInventory({ user, guild });
    this.logger?.debug(`[Inventory] reset ${user}@${guild}`);
    return true;
  }
}
