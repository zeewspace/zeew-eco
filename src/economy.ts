import { Adapter } from "./adapters/adapter";
import { UserKey, BuyResult, StoreItem, LeaderboardEntry, TransferResult, BulkItem, EconomyOptions, WorkResult, WorkCooldownResult, TransactionEntry } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export class Economy {
  private adapter: Adapter;
  private hooks;
  private logger;
  private currencies: string[];

  constructor(adapter: Adapter, options?: EconomyOptions) {
    this.adapter = adapter;
    this.hooks = options?.hooks;
    this.logger = options?.logger;
    this.currencies = options?.currencies ?? [];
  }

  async get(user: string, guild: string, currency?: string): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    if (!record) return 0;
    if (currency && currency !== "default") return record.currencies?.[currency] ?? 0;
    return record.money;
  }

  async add(user: string, guild: string, amount: number, currency?: string): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    const old = this.getRecordBalance(record, currency);
    const currencies = record?.currencies ? { ...record.currencies } : {};

    if (currency && currency !== "default") {
      currencies[currency] = (currencies[currency] ?? 0) + amount;
    }

    const newBalance = currency && currency !== "default"
      ? (record?.money ?? 0)
      : (record?.money ?? 0) + amount;

    await this.adapter.upsertMoney({ user, guild }, newBalance, Object.keys(currencies).length ? currencies : undefined);
    const newActual = currency && currency !== "default" ? (currencies[currency] ?? 0) : newBalance;

    this.logger?.debug(`[Economy] add ${amount}${currency ? ` ${currency}` : ""} to ${user}@${guild} → ${newActual}`);
    this.hooks?.onBalanceChange?.(user, guild, old, newActual);

    await this.logTransaction("add", amount, currency ?? "default", user, guild, { amount, currency });
    return newActual;
  }

  async remove(user: string, guild: string, amount: number, currency?: string): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    const old = this.getRecordBalance(record, currency);
    const currencies = record?.currencies ? { ...record.currencies } : {};

    if (currency && currency !== "default") {
      currencies[currency] = Math.max(0, (currencies[currency] ?? 0) - amount);
    }

    const newBalance = currency && currency !== "default"
      ? (record?.money ?? 0)
      : Math.max(0, (record?.money ?? 0) - amount);

    await this.adapter.upsertMoney({ user, guild }, newBalance, Object.keys(currencies).length ? currencies : undefined);
    const newActual = currency && currency !== "default" ? (currencies[currency] ?? 0) : newBalance;

    this.logger?.debug(`[Economy] remove ${amount} from ${user}@${guild} → ${newActual}`);
    this.hooks?.onBalanceChange?.(user, guild, old, newActual);

    await this.logTransaction("remove", -amount, currency ?? "default", user, guild, { amount, currency });
    return newActual;
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

    const currency = item.currency ?? "default";
    const balance = this.getRecordBalance(moneyRecord, currency);
    if (balance < item.price) return { error: "insufficient_funds" };

    if (item.stock != null && item.stock <= 0) return { error: "out_of_stock" };

    const newBalance = balance - item.price;

    if (currency === "default") {
      await this.adapter.upsertMoney({ user, guild }, moneyRecord.money - item.price, moneyRecord.currencies);
    } else {
      const currencies = { ...(moneyRecord.currencies ?? {}) };
      currencies[currency] = (currencies[currency] ?? 0) - item.price;
      await this.adapter.upsertMoney({ user, guild }, moneyRecord.money, currencies);
    }

    if (item.stock != null && item.stock > 0) {
      item.stock--;
      const items = storeRecord.items.map((i) => i.id === itemId ? item : i);
      await this.adapter.upsertStore({ guild }, items);
    }

    const inventoryRecord = await this.adapter.findInventory({ user, guild });
    const currentItems = inventoryRecord?.inventory ?? [];
    const newItem = { id: generateId(), name: item.name, item: item.item };
    currentItems.push(newItem);
    await this.adapter.upsertInventory({ user, guild }, currentItems);

    this.logger?.debug(`[Economy] ${user} bought ${item.name} for ${item.price}`);
    this.hooks?.onBalanceChange?.(user, guild, balance, newBalance);
    this.hooks?.onPurchase?.(user, guild, item);

    await this.logTransaction("buy", -item.price, currency, user, guild, { itemId, itemName: item.name });

    return { item, money: balance, newMoney: newBalance };
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

  async transfer(from: string, to: string, guild: string, amount: number, currency?: string): Promise<TransferResult | { error: string }> {
    const fromRecord = await this.adapter.findMoney({ user: from, guild });
    if (!fromRecord) return { error: "sender_not_found" };

    const balance = this.getRecordBalance(fromRecord, currency);
    if (balance < amount) return { error: "insufficient_funds" };

    const toRecord = await this.adapter.findMoney({ user: to, guild });
    const toOld = this.getRecordBalance(toRecord, currency);

    const fromNew = balance - amount;
    const toNew = toOld + amount;

    if (currency && currency !== "default") {
      const fromCurrencies = { ...(fromRecord.currencies ?? {}) };
      fromCurrencies[currency] = (fromCurrencies[currency] ?? 0) - amount;
      await this.adapter.upsertMoney({ user: from, guild }, fromRecord.money, fromCurrencies);

      const toCurrencies = { ...(toRecord?.currencies ?? {}) };
      toCurrencies[currency] = (toCurrencies[currency] ?? 0) + amount;
      await this.adapter.upsertMoney({ user: to, guild }, toRecord?.money ?? 0, toCurrencies);
    } else {
      await this.adapter.upsertMoney({ user: from, guild }, fromRecord.money - amount, fromRecord.currencies);
      await this.adapter.upsertMoney({ user: to, guild }, (toRecord?.money ?? 0) + amount, toRecord?.currencies);
    }

    this.logger?.debug(`[Economy] transfer ${amount} from ${from} to ${to}@${guild}`);
    this.hooks?.onTransfer?.(from, to, guild, amount);

    await this.logTransaction("transfer", -amount, currency ?? "default", from, guild, { to, amount });
    await this.logTransaction("transfer", amount, currency ?? "default", to, guild, { from, amount });

    return { from: fromNew, to: toNew, amount };
  }

  async bulkAdd(items: BulkItem[]): Promise<number> {
    const results = await Promise.all(items.map((item) => this.add(item.user, item.guild, item.amount)));
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

  async history(user: string, guild: string, options?: { limit?: number }): Promise<TransactionEntry[]> {
    return this.adapter.getTransactions(user, guild, options?.limit ?? 20);
  }

  private getRecordBalance(record: { money: number; currencies?: Record<string, number> } | null, currency?: string): number {
    if (!record) return 0;
    if (currency && currency !== "default") return record.currencies?.[currency] ?? 0;
    return record.money;
  }

  private async logTransaction(type: string, amount: number, currency: string, user: string, guild: string, meta: Record<string, unknown>): Promise<void> {
    const entry: TransactionEntry = {
      id: generateId(),
      type,
      amount,
      currency,
      timestamp: Date.now(),
      meta: { ...meta, user, guild },
    };
    await this.adapter.addTransaction(guild, entry);
  }
}
