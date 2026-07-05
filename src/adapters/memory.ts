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

function matchUser(a: UserKey, b: UserKey): boolean {
  return a.user === b.user && a.guild === b.guild;
}

function matchGuild(a: GuildKey, b: GuildKey): boolean {
  return a.guild === b.guild;
}

export class MemoryAdapter implements Adapter {
  money: MoneyRecord[] = [];
  stores: StoreRecord[] = [];
  inventory: InventoryRecord[] = [];
  bank: BankRecord[] = [];
  cooldowns = new Map<string, number>();
  daily: DailyRecord[] = [];
  transactions: TransactionEntry[] = [];
  badgeDefs: Map<string, BadgeDefinition[]> = new Map();
  userBadges: BadgeRecord[] = [];
  listings: MarketListing[] = [];

  reset(): void {
    this.money = [];
    this.stores = [];
    this.inventory = [];
    this.bank = [];
    this.cooldowns.clear();
    this.daily = [];
    this.transactions = [];
    this.badgeDefs.clear();
    this.userBadges = [];
    this.listings = [];
  }

  // ─── Money ───────────────────────────────────────────

  async findMoney(key: UserKey): Promise<MoneyRecord | null> {
    const found = this.money.find((r) => matchUser(r, key));
    if (!found) return null;
    return { ...found, currencies: found.currencies ? { ...found.currencies } : undefined };
  }

  async upsertMoney(key: UserKey, money: number, currencies?: Record<string, number>): Promise<void> {
    const idx = this.money.findIndex((r) => matchUser(r, key));
    if (idx >= 0) {
      this.money[idx].money = money;
      if (currencies) this.money[idx].currencies = { ...currencies };
    } else {
      this.money.push({ ...key, money, currencies: currencies ? { ...currencies } : undefined });
    }
  }

  async deleteMoney(key: UserKey): Promise<void> {
    this.money = this.money.filter((r) => !matchUser(r, key));
  }

  async allMoney(guild: string): Promise<MoneyRecord[]> {
    return this.money.filter((r) => r.guild === guild).map((r) => ({ ...r }));
  }

  // ─── Store ───────────────────────────────────────────

  async findStore(key: GuildKey): Promise<StoreRecord | null> {
    const found = this.stores.find((r) => matchGuild(r, key));
    return found ? { ...found, items: found.items.map((i) => ({ ...i })) } : null;
  }

  async upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void> {
    const idx = this.stores.findIndex((r) => matchGuild(r, key));
    if (idx >= 0) {
      this.stores[idx].items = items;
    } else {
      this.stores.push({ guild: key.guild, items });
    }
  }

  async deleteStore(key: GuildKey): Promise<void> {
    this.stores = this.stores.filter((r) => !matchGuild(r, key));
  }

  // ─── Inventory ───────────────────────────────────────

  async findInventory(key: UserKey): Promise<InventoryRecord | null> {
    const found = this.inventory.find((r) => matchUser(r, key));
    return found ? { ...found, inventory: found.inventory.map((i) => ({ ...i })) } : null;
  }

  async upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void> {
    const idx = this.inventory.findIndex((r) => matchUser(r, key));
    if (idx >= 0) {
      this.inventory[idx].inventory = items;
    } else {
      this.inventory.push({ ...key, inventory: items });
    }
  }

  async deleteInventory(key: UserKey): Promise<void> {
    this.inventory = this.inventory.filter((r) => !matchUser(r, key));
  }

  // ─── Bank ────────────────────────────────────────────

  async findBank(key: UserKey): Promise<BankRecord | null> {
    const found = this.bank.find((r) => matchUser(r, key));
    return found ? { ...found } : null;
  }

  async upsertBank(key: UserKey, money: number): Promise<void> {
    const idx = this.bank.findIndex((r) => matchUser(r, key));
    if (idx >= 0) {
      this.bank[idx].money = money;
    } else {
      this.bank.push({ ...key, money });
    }
  }

  async deleteBank(key: UserKey): Promise<void> {
    this.bank = this.bank.filter((r) => !matchUser(r, key));
  }

  async allBank(guild: string): Promise<BankRecord[]> {
    return this.bank.filter((r) => r.guild === guild).map((r) => ({ ...r }));
  }

  // ─── Cooldowns ──────────────────────────────────────

  async getCooldown(user: string, guild: string, action: string): Promise<number | null> {
    return this.cooldowns.get(`${user}:${guild}:${action}`) ?? null;
  }

  async setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void> {
    this.cooldowns.set(`${user}:${guild}:${action}`, timestamp);
  }

  // ─── Daily ──────────────────────────────────────────

  async findDaily(key: UserKey): Promise<DailyRecord | null> {
    const found = this.daily.find((r) => matchUser(r, key));
    return found ? { ...found } : null;
  }

  async upsertDaily(key: UserKey, record: DailyRecord): Promise<void> {
    const idx = this.daily.findIndex((r) => matchUser(r, key));
    if (idx >= 0) {
      this.daily[idx] = { ...record };
    } else {
      this.daily.push({ ...record });
    }
  }

  // ─── History ────────────────────────────────────────

  async addTransaction(guild: string, entry: TransactionEntry): Promise<void> {
    this.transactions.push({ ...entry });
  }

  async getTransactions(user: string, guild: string, limit: number = 20): Promise<TransactionEntry[]> {
    return this.transactions
      .filter((t) => t.meta?.user === user && t.meta?.guild === guild)
      .slice(-limit);
  }

  // ─── Badges ─────────────────────────────────────────

  async findBadgeDefinitions(guild: string): Promise<BadgeDefinition[]> {
    return (this.badgeDefs.get(guild) ?? []).map((b) => ({ ...b }));
  }

  async upsertBadgeDefinition(guild: string, badge: BadgeDefinition): Promise<void> {
    const defs = this.badgeDefs.get(guild) ?? [];
    const idx = defs.findIndex((b) => b.id === badge.id);
    if (idx >= 0) {
      defs[idx] = { ...badge };
    } else {
      defs.push({ ...badge });
    }
    this.badgeDefs.set(guild, defs);
  }

  async deleteBadgeDefinition(guild: string, badgeId: string): Promise<void> {
    const defs = this.badgeDefs.get(guild) ?? [];
    this.badgeDefs.set(guild, defs.filter((b) => b.id !== badgeId));
  }

  async findUserBadges(key: UserKey): Promise<BadgeRecord | null> {
    const found = this.userBadges.find((r) => matchUser(r, key));
    return found ? { ...found, badges: found.badges.map((b) => ({ ...b })) } : null;
  }

  async upsertUserBadges(key: UserKey, badges: BadgeRecord["badges"]): Promise<void> {
    const idx = this.userBadges.findIndex((r) => matchUser(r, key));
    if (idx >= 0) {
      this.userBadges[idx].badges = badges;
    } else {
      this.userBadges.push({ ...key, badges });
    }
  }

  // ─── Market ─────────────────────────────────────────

  async addListing(listing: MarketListing): Promise<void> {
    this.listings.push({ ...listing });
  }

  async removeListing(listingId: string): Promise<void> {
    this.listings = this.listings.filter((l) => l.id !== listingId);
  }

  async findListing(listingId: string): Promise<MarketListing | null> {
    return this.listings.find((l) => l.id === listingId) ?? null;
  }

  async getGuildListings(guild: string): Promise<MarketListing[]> {
    return this.listings.filter((l) => l.guild === guild).map((l) => ({ ...l }));
  }

  async getUserListings(user: string, guild: string): Promise<MarketListing[]> {
    return this.listings
      .filter((l) => l.seller === user && l.guild === guild)
      .map((l) => ({ ...l }));
  }
}
