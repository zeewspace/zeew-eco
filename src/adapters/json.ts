import * as fs from "fs";
import * as path from "path";
import { Adapter } from "./adapter";
import {
  UserKey,
  GuildKey,
  MoneyRecord,
  StoreRecord,
  InventoryRecord,
  BankRecord,
} from "../types";

interface CooldownEntry {
  key: string;
  timestamp: number;
}

interface JsonDB {
  money: MoneyRecord[];
  stores: StoreRecord[];
  inventory: InventoryRecord[];
  bank: BankRecord[];
  cooldowns: CooldownEntry[];
}

function matchUser(a: UserKey, b: UserKey): boolean {
  return a.user === b.user && a.guild === b.guild;
}

function matchGuild(a: GuildKey, b: GuildKey): boolean {
  return a.guild === b.guild;
}

function cooldownKey(user: string, guild: string, action: string): string {
  return `${user}:${guild}:${action}`;
}

export class JsonAdapter implements Adapter {
  private filePath: string;
  private data: JsonDB;

  constructor(filePath: string = "./zeew-eco.json") {
    this.filePath = path.resolve(filePath);
    this.data = this.load();
  }

  private load(): JsonDB {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        return { ...parsed, cooldowns: parsed.cooldowns ?? [] };
      }
    } catch {
      // corrupted file, start fresh
    }
    return { money: [], stores: [], inventory: [], bank: [], cooldowns: [] };
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  async findMoney(key: UserKey): Promise<MoneyRecord | null> {
    return this.data.money.find((r) => matchUser(r, key)) ?? null;
  }

  async upsertMoney(key: UserKey, money: number): Promise<void> {
    const idx = this.data.money.findIndex((r) => matchUser(r, key));
    if (idx >= 0) {
      this.data.money[idx].money = money;
    } else {
      this.data.money.push({ ...key, money });
    }
    this.save();
  }

  async deleteMoney(key: UserKey): Promise<void> {
    this.data.money = this.data.money.filter((r) => !matchUser(r, key));
    this.save();
  }

  async allMoney(guild: string): Promise<MoneyRecord[]> {
    return this.data.money.filter((r) => r.guild === guild);
  }

  async findStore(key: GuildKey): Promise<StoreRecord | null> {
    return this.data.stores.find((r) => matchGuild(r, key)) ?? null;
  }

  async upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void> {
    const idx = this.data.stores.findIndex((r) => matchGuild(r, key));
    if (idx >= 0) {
      this.data.stores[idx].items = items;
    } else {
      this.data.stores.push({ guild: key.guild, items });
    }
    this.save();
  }

  async deleteStore(key: GuildKey): Promise<void> {
    this.data.stores = this.data.stores.filter((r) => !matchGuild(r, key));
    this.save();
  }

  async findInventory(key: UserKey): Promise<InventoryRecord | null> {
    return this.data.inventory.find((r) => matchUser(r, key)) ?? null;
  }

  async upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void> {
    const idx = this.data.inventory.findIndex((r) => matchUser(r, key));
    if (idx >= 0) {
      this.data.inventory[idx].inventory = items;
    } else {
      this.data.inventory.push({ ...key, inventory: items });
    }
    this.save();
  }

  async deleteInventory(key: UserKey): Promise<void> {
    this.data.inventory = this.data.inventory.filter((r) => !matchUser(r, key));
    this.save();
  }

  async findBank(key: UserKey): Promise<BankRecord | null> {
    return this.data.bank.find((r) => matchUser(r, key)) ?? null;
  }

  async upsertBank(key: UserKey, money: number): Promise<void> {
    const idx = this.data.bank.findIndex((r) => matchUser(r, key));
    if (idx >= 0) {
      this.data.bank[idx].money = money;
    } else {
      this.data.bank.push({ ...key, money });
    }
    this.save();
  }

  async deleteBank(key: UserKey): Promise<void> {
    this.data.bank = this.data.bank.filter((r) => !matchUser(r, key));
    this.save();
  }

  async allBank(guild: string): Promise<BankRecord[]> {
    return this.data.bank.filter((r) => r.guild === guild);
  }

  async getCooldown(user: string, guild: string, action: string): Promise<number | null> {
    const key = cooldownKey(user, guild, action);
    const entry = this.data.cooldowns.find((c) => c.key === key);
    return entry?.timestamp ?? null;
  }

  async setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void> {
    const key = cooldownKey(user, guild, action);
    const idx = this.data.cooldowns.findIndex((c) => c.key === key);
    if (idx >= 0) {
      this.data.cooldowns[idx].timestamp = timestamp;
    } else {
      this.data.cooldowns.push({ key, timestamp });
    }
    this.save();
  }
}
