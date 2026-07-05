import { Adapter } from "./adapters/adapter";
import { StoreItem, StoreOptions } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export class Store {
  private adapter: Adapter;
  private hooks;
  private logger;

  constructor(adapter: Adapter, options?: StoreOptions) {
    this.adapter = adapter;
    this.hooks = options?.hooks;
    this.logger = options?.logger;
  }

  async get(guild: string): Promise<StoreItem[]> {
    const record = await this.adapter.findStore({ guild });
    return record?.items ?? [];
  }

  async add(
    guild: string,
    name: string,
    description: string,
    price: number,
    item?: string
  ): Promise<StoreItem> {
    const record = await this.adapter.findStore({ guild });
    const items = record?.items ?? [];
    const newItem: StoreItem = {
      id: generateId(),
      name,
      description,
      price,
      item: item ?? null,
    };
    items.push(newItem);
    await this.adapter.upsertStore({ guild }, items);
    this.logger?.debug(`[Store] added "${name}" to ${guild}`);
    this.hooks?.onItemAdded?.(guild, newItem);
    return newItem;
  }

  async remove(guild: string, itemId: string): Promise<boolean> {
    const record = await this.adapter.findStore({ guild });
    if (!record) return false;

    const filtered = record.items.filter((i) => i.id !== itemId);
    if (filtered.length === record.items.length) return false;

    await this.adapter.upsertStore({ guild }, filtered);
    this.logger?.debug(`[Store] removed item ${itemId} from ${guild}`);
    this.hooks?.onItemRemoved?.(guild, itemId);
    return true;
  }

  async reset(guild: string): Promise<boolean> {
    await this.adapter.deleteStore({ guild });
    this.logger?.debug(`[Store] reset ${guild}`);
    return true;
  }
}
