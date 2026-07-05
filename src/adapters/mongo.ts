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

export class MongoAdapter implements Adapter {
  private db: any;
  private collections: any;

  constructor(uriOrDb: string | any, dbName: string = "zeew-eco") {
    this.db = uriOrDb;
    this.collections = {
      money: this.db.collection("eco_money"),
      stores: this.db.collection("eco_stores"),
      inventory: this.db.collection("eco_inventory"),
      bank: this.db.collection("eco_bank"),
      daily: this.db.collection("eco_daily"),
      transactions: this.db.collection("eco_transactions"),
      badgeDefs: this.db.collection("eco_badge_defs"),
      userBadges: this.db.collection("eco_user_badges"),
      listings: this.db.collection("eco_listings"),
    };
    this.init();
  }

  private async init(): Promise<void> {
    await Promise.all([
      this.collections.money.createIndex({ user: 1, guild: 1 }, { unique: true }),
      this.collections.stores.createIndex({ guild: 1 }, { unique: true }),
      this.collections.inventory.createIndex({ user: 1, guild: 1 }, { unique: true }),
      this.collections.bank.createIndex({ user: 1, guild: 1 }, { unique: true }),
      this.collections.daily.createIndex({ user: 1, guild: 1 }, { unique: true }),
      this.collections.transactions.createIndex({ guild: 1, "meta.user": 1 }),
      this.collections.userBadges.createIndex({ user: 1, guild: 1 }, { unique: true }),
      this.collections.listings.createIndex({ guild: 1 }),
    ]);
  }

  // ─── Money ───────────────────────────────────────────

  async findMoney(key: UserKey): Promise<MoneyRecord | null> {
    return await this.collections.money.findOne({ user: key.user, guild: key.guild });
  }

  async upsertMoney(key: UserKey, money: number, currencies?: Record<string, number>): Promise<void> {
    const update: any = { $set: { money } };
    if (currencies) update.$set.currencies = currencies;
    await this.collections.money.updateOne(
      { user: key.user, guild: key.guild },
      update,
      { upsert: true }
    );
  }

  async deleteMoney(key: UserKey): Promise<void> {
    await this.collections.money.deleteOne({ user: key.user, guild: key.guild });
  }

  async allMoney(guild: string): Promise<MoneyRecord[]> {
    return await this.collections.money.find({ guild }).toArray();
  }

  // ─── Store ───────────────────────────────────────────

  async findStore(key: GuildKey): Promise<StoreRecord | null> {
    return await this.collections.stores.findOne({ guild: key.guild });
  }

  async upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void> {
    await this.collections.stores.updateOne(
      { guild: key.guild },
      { $set: { guild: key.guild, items } },
      { upsert: true }
    );
  }

  async deleteStore(key: GuildKey): Promise<void> {
    await this.collections.stores.deleteOne({ guild: key.guild });
  }

  // ─── Inventory ───────────────────────────────────────

  async findInventory(key: UserKey): Promise<InventoryRecord | null> {
    return await this.collections.inventory.findOne({ user: key.user, guild: key.guild });
  }

  async upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void> {
    await this.collections.inventory.updateOne(
      { user: key.user, guild: key.guild },
      { $set: { user: key.user, guild: key.guild, inventory: items } },
      { upsert: true }
    );
  }

  async deleteInventory(key: UserKey): Promise<void> {
    await this.collections.inventory.deleteOne({ user: key.user, guild: key.guild });
  }

  // ─── Bank ────────────────────────────────────────────

  async findBank(key: UserKey): Promise<BankRecord | null> {
    return await this.collections.bank.findOne({ user: key.user, guild: key.guild });
  }

  async upsertBank(key: UserKey, money: number): Promise<void> {
    await this.collections.bank.updateOne(
      { user: key.user, guild: key.guild },
      { $set: { money } },
      { upsert: true }
    );
  }

  async deleteBank(key: UserKey): Promise<void> {
    await this.collections.bank.deleteOne({ user: key.user, guild: key.guild });
  }

  async allBank(guild: string): Promise<BankRecord[]> {
    return await this.collections.bank.find({ guild }).toArray();
  }

  // ─── Cooldowns ──────────────────────────────────────

  async getCooldown(user: string, guild: string, action: string): Promise<number | null> {
    const doc = await this.collections.daily.findOne({ user, guild, action });
    return doc?.timestamp ?? null;
  }

  async setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void> {
    await this.collections.daily.updateOne(
      { user, guild, action },
      { $set: { timestamp } },
      { upsert: true }
    );
  }

  // ─── Daily ──────────────────────────────────────────

  async findDaily(key: UserKey): Promise<DailyRecord | null> {
    const doc = await this.collections.daily.findOne({ user: key.user, guild: key.guild, type: "daily" });
    if (!doc) return null;
    return { user: doc.user, guild: doc.guild, lastClaim: doc.lastClaim, streak: doc.streak };
  }

  async upsertDaily(key: UserKey, record: DailyRecord): Promise<void> {
    await this.collections.daily.updateOne(
      { user: key.user, guild: key.guild, type: "daily" },
      { $set: { ...record, type: "daily" } },
      { upsert: true }
    );
  }

  // ─── History ────────────────────────────────────────

  async addTransaction(guild: string, entry: TransactionEntry): Promise<void> {
    await this.collections.transactions.insertOne({ ...entry, guild });
  }

  async getTransactions(user: string, guild: string, limit: number = 20): Promise<TransactionEntry[]> {
    return await this.collections.transactions
      .find({ guild, "meta.user": user })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  // ─── Badges ─────────────────────────────────────────

  async findBadgeDefinitions(guild: string): Promise<BadgeDefinition[]> {
    return await this.collections.badgeDefs.find({ guild }).toArray();
  }

  async upsertBadgeDefinition(guild: string, badge: BadgeDefinition): Promise<void> {
    await this.collections.badgeDefs.updateOne(
      { guild, id: badge.id },
      { $set: badge },
      { upsert: true }
    );
  }

  async deleteBadgeDefinition(guild: string, badgeId: string): Promise<void> {
    await this.collections.badgeDefs.deleteOne({ guild, id: badgeId });
  }

  async findUserBadges(key: UserKey): Promise<BadgeRecord | null> {
    return await this.collections.userBadges.findOne({ user: key.user, guild: key.guild });
  }

  async upsertUserBadges(key: UserKey, badges: BadgeRecord["badges"]): Promise<void> {
    await this.collections.userBadges.updateOne(
      { user: key.user, guild: key.guild },
      { $set: { badges } },
      { upsert: true }
    );
  }

  // ─── Market ─────────────────────────────────────────

  async addListing(listing: MarketListing): Promise<void> {
    await this.collections.listings.insertOne(listing);
  }

  async removeListing(listingId: string): Promise<void> {
    await this.collections.listings.deleteOne({ id: listingId });
  }

  async findListing(listingId: string): Promise<MarketListing | null> {
    return await this.collections.listings.findOne({ id: listingId });
  }

  async getGuildListings(guild: string): Promise<MarketListing[]> {
    return await this.collections.listings.find({ guild }).toArray();
  }

  async getUserListings(user: string, guild: string): Promise<MarketListing[]> {
    return await this.collections.listings.find({ seller: user, guild }).toArray();
  }
}
