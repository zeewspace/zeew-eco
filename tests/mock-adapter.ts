import { Adapter } from "../../src/adapters/adapter";
import {
  UserKey,
  GuildKey,
  MoneyRecord,
  StoreRecord,
  InventoryRecord,
  BankRecord,
} from "../../src/types";

export class MockAdapter implements Adapter {
  money: MoneyRecord[] = [];
  stores: StoreRecord[] = [];
  inventory: InventoryRecord[] = [];
  bank: BankRecord[] = [];
  cooldowns: Map<string, number> = new Map();

  reset(): void {
    this.money = [];
    this.stores = [];
    this.inventory = [];
    this.bank = [];
    this.cooldowns.clear();
  }

  async findMoney(key: UserKey): Promise<MoneyRecord | null> {
    const found = this.money.find((r) => r.user === key.user && r.guild === key.guild);
    return found ? { ...found } : null;
  }

  async upsertMoney(key: UserKey, money: number): Promise<void> {
    const idx = this.money.findIndex((r) => r.user === key.user && r.guild === key.guild);
    if (idx >= 0) {
      this.money[idx].money = money;
    } else {
      this.money.push({ ...key, money });
    }
  }

  async deleteMoney(key: UserKey): Promise<void> {
    this.money = this.money.filter((r) => !(r.user === key.user && r.guild === key.guild));
  }

  async allMoney(guild: string): Promise<MoneyRecord[]> {
    return this.money.filter((r) => r.guild === guild).map((r) => ({ ...r }));
  }

  async findStore(key: GuildKey): Promise<StoreRecord | null> {
    const found = this.stores.find((r) => r.guild === key.guild);
    return found ? { ...found, items: [...found.items] } : null;
  }

  async upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void> {
    const idx = this.stores.findIndex((r) => r.guild === key.guild);
    if (idx >= 0) {
      this.stores[idx].items = items;
    } else {
      this.stores.push({ guild: key.guild, items });
    }
  }

  async deleteStore(key: GuildKey): Promise<void> {
    this.stores = this.stores.filter((r) => r.guild !== key.guild);
  }

  async findInventory(key: UserKey): Promise<InventoryRecord | null> {
    const found = this.inventory.find((r) => r.user === key.user && r.guild === key.guild);
    return found ? { ...found, inventory: [...found.inventory] } : null;
  }

  async upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void> {
    const idx = this.inventory.findIndex((r) => r.user === key.user && r.guild === key.guild);
    if (idx >= 0) {
      this.inventory[idx].inventory = items;
    } else {
      this.inventory.push({ ...key, inventory: items });
    }
  }

  async deleteInventory(key: UserKey): Promise<void> {
    this.inventory = this.inventory.filter(
      (r) => !(r.user === key.user && r.guild === key.guild)
    );
  }

  async findBank(key: UserKey): Promise<BankRecord | null> {
    const found = this.bank.find((r) => r.user === key.user && r.guild === key.guild);
    return found ? { ...found } : null;
  }

  async upsertBank(key: UserKey, money: number): Promise<void> {
    const idx = this.bank.findIndex((r) => r.user === key.user && r.guild === key.guild);
    if (idx >= 0) {
      this.bank[idx].money = money;
    } else {
      this.bank.push({ ...key, money });
    }
  }

  async deleteBank(key: UserKey): Promise<void> {
    this.bank = this.bank.filter((r) => !(r.user === key.user && r.guild === key.guild));
  }

  async allBank(guild: string): Promise<BankRecord[]> {
    return this.bank.filter((r) => r.guild === guild).map((r) => ({ ...r }));
  }

  async getCooldown(user: string, guild: string, action: string): Promise<number | null> {
    const key = `${user}:${guild}:${action}`;
    return this.cooldowns.get(key) ?? null;
  }

  async setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void> {
    const key = `${user}:${guild}:${action}`;
    this.cooldowns.set(key, timestamp);
  }
}
