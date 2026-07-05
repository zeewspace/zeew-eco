import { Adapter } from "./adapters/adapter";
import { UserKey, BuyResult, StoreItem } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export class Economy {
  constructor(private adapter: Adapter) {}

  async get(user: string, guild: string): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    return record?.money ?? 0;
  }

  async add(user: string, guild: string, amount: number): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    const current = record?.money ?? 0;
    const next = current + amount;
    await this.adapter.upsertMoney({ user, guild }, next);
    return next;
  }

  async remove(user: string, guild: string, amount: number): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    const current = record?.money ?? 0;
    const next = Math.max(0, current - amount);
    await this.adapter.upsertMoney({ user, guild }, next);
    return next;
  }

  async reset(user: string, guild: string): Promise<boolean> {
    await this.adapter.deleteMoney({ user, guild });
    return true;
  }

  async buy(user: string, guild: string, itemId: string): Promise<BuyResult | { error: string }> {
    const [moneyRecord, storeRecord] = await Promise.all([
      this.adapter.findMoney({ user, guild }),
      this.adapter.findStore({ guild }),
    ]);

    if (!storeRecord) return { error: "store_not_found" };
    if (!moneyRecord) return { error: "user_not_found" };

    const item: StoreItem | undefined = storeRecord.items.find((i) => i.id === itemId);
    if (!item) return { error: "item_not_found" };
    if (moneyRecord.money < item.price) return { error: "insufficient_funds" };

    const newMoney = moneyRecord.money - item.price;
    await this.adapter.upsertMoney({ user, guild }, newMoney);

    const inventoryRecord = await this.adapter.findInventory({ user, guild });
    const currentItems = inventoryRecord?.inventory ?? [];
    const newItem = { id: generateId(), name: item.name, item: item.item };
    currentItems.push(newItem);
    await this.adapter.upsertInventory({ user, guild }, currentItems);

    return {
      item,
      money: moneyRecord.money,
      newMoney,
    };
  }

  async work(user: string, guild: string, maxEarnings: number): Promise<number> {
    const earned = Math.floor(Math.random() * maxEarnings);
    await this.add(user, guild, earned);
    return earned;
  }
}
