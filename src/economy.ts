import { Adapter } from "./adapters/adapter";
import { UserKey, BuyResult, StoreItem, LeaderboardEntry, TransferResult, BulkItem, EconomyOptions, WorkResult, WorkCooldownResult } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export class Economy {
  private adapter: Adapter;
  private hooks;
  private logger;

  constructor(adapter: Adapter, options?: EconomyOptions) {
    this.adapter = adapter;
    this.hooks = options?.hooks;
    this.logger = options?.logger;
  }

  async get(user: string, guild: string): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    return record?.money ?? 0;
  }

  async add(user: string, guild: string, amount: number): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    const old = record?.money ?? 0;
    const next = old + amount;
    await this.adapter.upsertMoney({ user, guild }, next);
    this.logger?.debug(`[Economy] add ${amount} to ${user}@${guild} → ${next}`);
    this.hooks?.onBalanceChange?.(user, guild, old, next);
    return next;
  }

  async remove(user: string, guild: string, amount: number): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    const old = record?.money ?? 0;
    const next = Math.max(0, old - amount);
    await this.adapter.upsertMoney({ user, guild }, next);
    this.logger?.debug(`[Economy] remove ${amount} from ${user}@${guild} → ${next}`);
    this.hooks?.onBalanceChange?.(user, guild, old, next);
    return next;
  }

  async reset(user: string, guild: string): Promise<boolean> {
    await this.adapter.deleteMoney({ user, guild });
    this.logger?.debug(`[Economy] reset ${user}@${guild}`);
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

    this.logger?.debug(`[Economy] ${user} bought ${item.name} for ${item.price}`);
    this.hooks?.onBalanceChange?.(user, guild, moneyRecord.money, newMoney);
    this.hooks?.onPurchase?.(user, guild, item);

    return { item, money: moneyRecord.money, newMoney };
  }

  async work(user: string, guild: string, maxEarnings: number, options?: { cooldown?: number }): Promise<WorkResult | WorkCooldownResult> {
    if (options?.cooldown) {
      const lastUsed = await this.adapter.getCooldown(user, guild, "work");
      if (lastUsed) {
        const elapsed = Date.now() - lastUsed;
        if (elapsed < options.cooldown) {
          return { error: "cooldown", retryIn: options.cooldown - elapsed };
        }
      }
    }

    const earned = Math.floor(Math.random() * maxEarnings);
    await this.add(user, guild, earned);

    if (options?.cooldown) {
      await this.adapter.setCooldown(user, guild, "work", Date.now());
    }

    this.logger?.debug(`[Economy] ${user} worked and earned ${earned}`);
    this.hooks?.onWork?.(user, guild, earned);

    return { earned };
  }

  async transfer(from: string, to: string, guild: string, amount: number): Promise<TransferResult | { error: string }> {
    const fromRecord = await this.adapter.findMoney({ user: from, guild });
    if (!fromRecord) return { error: "sender_not_found" };
    if (fromRecord.money < amount) return { error: "insufficient_funds" };

    const toRecord = await this.adapter.findMoney({ user: to, guild });
    const toOld = toRecord?.money ?? 0;

    const fromNew = fromRecord.money - amount;
    const toNew = toOld + amount;

    await Promise.all([
      this.adapter.upsertMoney({ user: from, guild }, fromNew),
      this.adapter.upsertMoney({ user: to, guild }, toNew),
    ]);

    this.logger?.debug(`[Economy] transfer ${amount} from ${from} to ${to}@${guild}`);
    this.hooks?.onBalanceChange?.(from, guild, fromRecord.money, fromNew);
    this.hooks?.onBalanceChange?.(to, guild, toOld, toNew);
    this.hooks?.onTransfer?.(from, to, guild, amount);

    return { from: fromNew, to: toNew, amount };
  }

  async bulkAdd(items: BulkItem[]): Promise<number> {
    const results = await Promise.all(
      items.map((item) => this.add(item.user, item.guild, item.amount))
    );
    this.logger?.debug(`[Economy] bulkAdd ${items.length} entries`);
    return results.length;
  }

  async leaderboard(guild: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const all = await this.adapter.allMoney(guild);
    return all
      .sort((a, b) => b.money - a.money)
      .slice(0, limit)
      .map((r) => ({ user: r.user, guild: r.guild, money: r.money }));
  }
}
