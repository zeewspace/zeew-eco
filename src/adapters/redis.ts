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

export class RedisAdapter implements Adapter {
  private redis: any;
  private prefix: string;

  constructor(redisClient: any, prefix: string = "zeew:") {
    this.redis = redisClient;
    this.prefix = prefix;
  }

  private key(...parts: string[]): string {
    return this.prefix + parts.join(":");
  }

  private async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  private async setJson(key: string, value: unknown): Promise<void> {
    await this.redis.set(key, JSON.stringify(value));
  }

  // ─── Money ───────────────────────────────────────────

  async findMoney(key: UserKey): Promise<MoneyRecord | null> {
    return this.getJson(this.key("money", key.guild, key.user));
  }

  async upsertMoney(key: UserKey, money: number, currencies?: Record<string, number>): Promise<void> {
    const record: MoneyRecord = { ...key, money, currencies };
    await this.setJson(this.key("money", key.guild, key.user), record);
    await this.redis.sadd(this.key("guild", key.guild, "money"), key.user);
  }

  async deleteMoney(key: UserKey): Promise<void> {
    await this.redis.del(this.key("money", key.guild, key.user));
    await this.redis.srem(this.key("guild", key.guild, "money"), key.user);
  }

  async allMoney(guild: string): Promise<MoneyRecord[]> {
    const userIds = await this.redis.smembers(this.key("guild", guild, "money"));
    const results: MoneyRecord[] = [];
    for (const userId of userIds) {
      const record = await this.getJson<MoneyRecord>(this.key("money", guild, userId));
      if (record) results.push(record);
    }
    return results;
  }

  // ─── Store ───────────────────────────────────────────

  async findStore(key: GuildKey): Promise<StoreRecord | null> {
    return this.getJson(this.key("store", key.guild));
  }

  async upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void> {
    await this.setJson(this.key("store", key.guild), { guild: key.guild, items });
  }

  async deleteStore(key: GuildKey): Promise<void> {
    await this.redis.del(this.key("store", key.guild));
  }

  // ─── Inventory ───────────────────────────────────────

  async findInventory(key: UserKey): Promise<InventoryRecord | null> {
    return this.getJson(this.key("inv", key.guild, key.user));
  }

  async upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void> {
    await this.setJson(this.key("inv", key.guild, key.user), { ...key, inventory: items });
  }

  async deleteInventory(key: UserKey): Promise<void> {
    await this.redis.del(this.key("inv", key.guild, key.user));
  }

  // ─── Bank ────────────────────────────────────────────

  async findBank(key: UserKey): Promise<BankRecord | null> {
    return this.getJson(this.key("bank", key.guild, key.user));
  }

  async upsertBank(key: UserKey, money: number): Promise<void> {
    await this.setJson(this.key("bank", key.guild, key.user), { ...key, money });
    await this.redis.sadd(this.key("guild", key.guild, "bank"), key.user);
  }

  async deleteBank(key: UserKey): Promise<void> {
    await this.redis.del(this.key("bank", key.guild, key.user));
    await this.redis.srem(this.key("guild", key.guild, "bank"), key.user);
  }

  async allBank(guild: string): Promise<BankRecord[]> {
    const userIds = await this.redis.smembers(this.key("guild", guild, "bank"));
    const results: BankRecord[] = [];
    for (const userId of userIds) {
      const record = await this.getJson<BankRecord>(this.key("bank", guild, userId));
      if (record) results.push(record);
    }
    return results;
  }

  // ─── Cooldowns ──────────────────────────────────────

  async getCooldown(user: string, guild: string, action: string): Promise<number | null> {
    const val = await this.redis.get(this.key("cd", guild, user, action));
    return val ? parseInt(val, 10) : null;
  }

  async setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void> {
    await this.redis.set(this.key("cd", guild, user, action), timestamp.toString());
  }

  // ─── Daily ──────────────────────────────────────────

  async findDaily(key: UserKey): Promise<DailyRecord | null> {
    return this.getJson(this.key("daily", key.guild, key.user));
  }

  async upsertDaily(key: UserKey, record: DailyRecord): Promise<void> {
    await this.setJson(this.key("daily", key.guild, key.user), record);
  }

  // ─── History ────────────────────────────────────────

  async addTransaction(guild: string, entry: TransactionEntry): Promise<void> {
    const listKey = this.key("txns", guild, entry.meta?.user as string);
    await this.redis.lpush(listKey, JSON.stringify(entry));
    await this.redis.ltrim(listKey, 0, 999);
  }

  async getTransactions(user: string, guild: string, limit: number = 20): Promise<TransactionEntry[]> {
    const raw = await this.redis.lrange(this.key("txns", guild, user), 0, limit - 1);
    return raw.map((r: string) => JSON.parse(r));
  }

  // ─── Badges ─────────────────────────────────────────

  async findBadgeDefinitions(guild: string): Promise<BadgeDefinition[]> {
    const raw = await this.redis.smembers(this.key("badge-defs", guild));
    return raw.map((r: string) => JSON.parse(r));
  }

  async upsertBadgeDefinition(guild: string, badge: BadgeDefinition): Promise<void> {
    await this.redis.sadd(this.key("badge-defs", guild), JSON.stringify(badge));
  }

  async deleteBadgeDefinition(guild: string, badgeId: string): Promise<void> {
    const defs = await this.findBadgeDefinitions(guild);
    const filtered = defs.filter((d) => d.id !== badgeId);
    await this.redis.del(this.key("badge-defs", guild));
    for (const d of filtered) {
      await this.redis.sadd(this.key("badge-defs", guild), JSON.stringify(d));
    }
  }

  async findUserBadges(key: UserKey): Promise<BadgeRecord | null> {
    return this.getJson(this.key("user-badges", key.guild, key.user));
  }

  async upsertUserBadges(key: UserKey, badges: BadgeRecord["badges"]): Promise<void> {
    await this.setJson(this.key("user-badges", key.guild, key.user), { ...key, badges });
  }

  // ─── Market ─────────────────────────────────────────

  async addListing(listing: MarketListing): Promise<void> {
    await this.setJson(this.key("listing", listing.id), listing);
    await this.redis.sadd(this.key("market", listing.guild), listing.id);
    await this.redis.sadd(this.key("user-listings", listing.seller, listing.guild), listing.id);
  }

  async removeListing(listingId: string): Promise<void> {
    const listing = await this.findListing(listingId);
    if (listing) {
      await this.redis.srem(this.key("market", listing.guild), listingId);
      await this.redis.srem(this.key("user-listings", listing.seller, listing.guild), listingId);
    }
    await this.redis.del(this.key("listing", listingId));
  }

  async findListing(listingId: string): Promise<MarketListing | null> {
    return this.getJson(this.key("listing", listingId));
  }

  async getGuildListings(guild: string): Promise<MarketListing[]> {
    const ids = await this.redis.smembers(this.key("market", guild));
    const results: MarketListing[] = [];
    for (const id of ids) {
      const listing = await this.findListing(id);
      if (listing) results.push(listing);
    }
    return results;
  }

  async getUserListings(user: string, guild: string): Promise<MarketListing[]> {
    const ids = await this.redis.smembers(this.key("user-listings", user, guild));
    const results: MarketListing[] = [];
    for (const id of ids) {
      const listing = await this.findListing(id);
      if (listing) results.push(listing);
    }
    return results;
  }
}
