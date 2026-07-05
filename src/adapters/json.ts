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
  DailyRecord,
  TransactionEntry,
  BadgeDefinition,
  BadgeRecord,
  MarketListing,
} from "../types";

interface JsonDB {
  money: MoneyRecord[];
  stores: StoreRecord[];
  inventory: InventoryRecord[];
  bank: BankRecord[];
  cooldowns: { key: string; timestamp: number }[];
  daily: DailyRecord[];
  transactions: TransactionEntry[];
  badgeDefs: { guild: string; badges: BadgeDefinition[] }[];
  userBadges: BadgeRecord[];
  listings: MarketListing[];
}

function userMatch(a: UserKey, b: UserKey): boolean {
  return a.user === b.user && a.guild === b.guild;
}
function guildMatch(a: GuildKey, b: GuildKey): boolean {
  return a.guild === b.guild;
}
function cdKey(u: string, g: string, a: string): string {
  return `${u}:${g}:${a}`;
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
        const p = JSON.parse(raw);
        return {
          money: p.money ?? [],
          stores: p.stores ?? [],
          inventory: p.inventory ?? [],
          bank: p.bank ?? [],
          cooldowns: p.cooldowns ?? [],
          daily: p.daily ?? [],
          transactions: p.transactions ?? [],
          badgeDefs: p.badgeDefs ?? [],
          userBadges: p.userBadges ?? [],
          listings: p.listings ?? [],
        };
      }
    } catch {}
    return { money: [], stores: [], inventory: [], bank: [], cooldowns: [], daily: [], transactions: [], badgeDefs: [], userBadges: [], listings: [] };
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  // ─── Money ───────────────────────────────────────────

  async findMoney(key: UserKey): Promise<MoneyRecord | null> {
    return this.data.money.find((r) => userMatch(r, key)) ?? null;
  }

  async upsertMoney(key: UserKey, money: number, currencies?: Record<string, number>): Promise<void> {
    const idx = this.data.money.findIndex((r) => userMatch(r, key));
    if (idx >= 0) {
      this.data.money[idx].money = money;
      if (currencies) this.data.money[idx].currencies = { ...currencies };
    } else {
      this.data.money.push({ ...key, money, currencies: currencies ? { ...currencies } : undefined });
    }
    this.save();
  }

  async deleteMoney(key: UserKey): Promise<void> {
    this.data.money = this.data.money.filter((r) => !userMatch(r, key));
    this.save();
  }

  async allMoney(guild: string): Promise<MoneyRecord[]> {
    return this.data.money.filter((r) => r.guild === guild);
  }

  // ─── Store ───────────────────────────────────────────

  async findStore(key: GuildKey): Promise<StoreRecord | null> {
    return this.data.stores.find((r) => guildMatch(r, key)) ?? null;
  }

  async upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void> {
    const idx = this.data.stores.findIndex((r) => guildMatch(r, key));
    if (idx >= 0) this.data.stores[idx].items = items;
    else this.data.stores.push({ guild: key.guild, items });
    this.save();
  }

  async deleteStore(key: GuildKey): Promise<void> {
    this.data.stores = this.data.stores.filter((r) => !guildMatch(r, key));
    this.save();
  }

  // ─── Inventory ───────────────────────────────────────

  async findInventory(key: UserKey): Promise<InventoryRecord | null> {
    return this.data.inventory.find((r) => userMatch(r, key)) ?? null;
  }

  async upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void> {
    const idx = this.data.inventory.findIndex((r) => userMatch(r, key));
    if (idx >= 0) this.data.inventory[idx].inventory = items;
    else this.data.inventory.push({ ...key, inventory: items });
    this.save();
  }

  async deleteInventory(key: UserKey): Promise<void> {
    this.data.inventory = this.data.inventory.filter((r) => !userMatch(r, key));
    this.save();
  }

  // ─── Bank ────────────────────────────────────────────

  async findBank(key: UserKey): Promise<BankRecord | null> {
    return this.data.bank.find((r) => userMatch(r, key)) ?? null;
  }

  async upsertBank(key: UserKey, money: number): Promise<void> {
    const idx = this.data.bank.findIndex((r) => userMatch(r, key));
    if (idx >= 0) this.data.bank[idx].money = money;
    else this.data.bank.push({ ...key, money });
    this.save();
  }

  async deleteBank(key: UserKey): Promise<void> {
    this.data.bank = this.data.bank.filter((r) => !userMatch(r, key));
    this.save();
  }

  async allBank(guild: string): Promise<BankRecord[]> {
    return this.data.bank.filter((r) => r.guild === guild);
  }

  // ─── Cooldowns ──────────────────────────────────────

  async getCooldown(user: string, guild: string, action: string): Promise<number | null> {
    const entry = this.data.cooldowns.find((c) => c.key === cdKey(user, guild, action));
    return entry?.timestamp ?? null;
  }

  async setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void> {
    const key = cdKey(user, guild, action);
    const idx = this.data.cooldowns.findIndex((c) => c.key === key);
    if (idx >= 0) this.data.cooldowns[idx].timestamp = timestamp;
    else this.data.cooldowns.push({ key, timestamp });
    this.save();
  }

  // ─── Daily ──────────────────────────────────────────

  async findDaily(key: UserKey): Promise<DailyRecord | null> {
    return this.data.daily.find((r) => userMatch(r, key)) ?? null;
  }

  async upsertDaily(key: UserKey, record: DailyRecord): Promise<void> {
    const idx = this.data.daily.findIndex((r) => userMatch(r, key));
    if (idx >= 0) this.data.daily[idx] = { ...record };
    else this.data.daily.push({ ...record });
    this.save();
  }

  // ─── History ────────────────────────────────────────

  async addTransaction(_guild: string, entry: TransactionEntry): Promise<void> {
    this.data.transactions.push({ ...entry });
    if (this.data.transactions.length > 10000) {
      this.data.transactions = this.data.transactions.slice(-5000);
    }
    this.save();
  }

  async getTransactions(user: string, guild: string, limit: number = 20): Promise<TransactionEntry[]> {
    return this.data.transactions
      .filter((t) => t.meta?.user === user && t.meta?.guild === guild)
      .slice(-limit);
  }

  // ─── Badges ─────────────────────────────────────────

  async findBadgeDefinitions(guild: string): Promise<BadgeDefinition[]> {
    return this.data.badgeDefs.find((g) => g.guild === guild)?.badges ?? [];
  }

  async upsertBadgeDefinition(guild: string, badge: BadgeDefinition): Promise<void> {
    let group = this.data.badgeDefs.find((g) => g.guild === guild);
    if (!group) {
      group = { guild, badges: [] };
      this.data.badgeDefs.push(group);
    }
    const idx = group.badges.findIndex((b) => b.id === badge.id);
    if (idx >= 0) group.badges[idx] = { ...badge };
    else group.badges.push({ ...badge });
    this.save();
  }

  async deleteBadgeDefinition(guild: string, badgeId: string): Promise<void> {
    const group = this.data.badgeDefs.find((g) => g.guild === guild);
    if (group) group.badges = group.badges.filter((b) => b.id !== badgeId);
    this.save();
  }

  async findUserBadges(key: UserKey): Promise<BadgeRecord | null> {
    return this.data.userBadges.find((r) => userMatch(r, key)) ?? null;
  }

  async upsertUserBadges(key: UserKey, badges: BadgeRecord["badges"]): Promise<void> {
    const idx = this.data.userBadges.findIndex((r) => userMatch(r, key));
    if (idx >= 0) this.data.userBadges[idx].badges = badges;
    else this.data.userBadges.push({ ...key, badges });
    this.save();
  }

  // ─── Market ─────────────────────────────────────────

  async addListing(listing: MarketListing): Promise<void> {
    this.data.listings.push({ ...listing });
    this.save();
  }

  async removeListing(listingId: string): Promise<void> {
    this.data.listings = this.data.listings.filter((l) => l.id !== listingId);
    this.save();
  }

  async findListing(listingId: string): Promise<MarketListing | null> {
    return this.data.listings.find((l) => l.id === listingId) ?? null;
  }

  async getGuildListings(guild: string): Promise<MarketListing[]> {
    return this.data.listings.filter((l) => l.guild === guild);
  }

  async getUserListings(user: string, guild: string): Promise<MarketListing[]> {
    return this.data.listings.filter((l) => l.seller === user && l.guild === guild);
  }
}
