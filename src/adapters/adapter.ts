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

export interface Adapter {
  // ─── Money ───────────────────────────────────────────
  findMoney(key: UserKey): Promise<MoneyRecord | null>;
  upsertMoney(key: UserKey, money: number, currencies?: Record<string, number>): Promise<void>;
  deleteMoney(key: UserKey): Promise<void>;
  allMoney(guild: string): Promise<MoneyRecord[]>;

  // ─── Store ───────────────────────────────────────────
  findStore(key: GuildKey): Promise<StoreRecord | null>;
  upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void>;
  deleteStore(key: GuildKey): Promise<void>;

  // ─── Inventory ───────────────────────────────────────
  findInventory(key: UserKey): Promise<InventoryRecord | null>;
  upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void>;
  deleteInventory(key: UserKey): Promise<void>;

  // ─── Bank ────────────────────────────────────────────
  findBank(key: UserKey): Promise<BankRecord | null>;
  upsertBank(key: UserKey, money: number): Promise<void>;
  deleteBank(key: UserKey): Promise<void>;
  allBank(guild: string): Promise<BankRecord[]>;

  // ─── Cooldowns ──────────────────────────────────────
  getCooldown(user: string, guild: string, action: string): Promise<number | null>;
  setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void>;

  // ─── Daily ──────────────────────────────────────────
  findDaily(key: UserKey): Promise<DailyRecord | null>;
  upsertDaily(key: UserKey, record: DailyRecord): Promise<void>;

  // ─── History ────────────────────────────────────────
  addTransaction(guild: string, entry: TransactionEntry): Promise<void>;
  getTransactions(user: string, guild: string, limit?: number): Promise<TransactionEntry[]>;

  // ─── Badges ─────────────────────────────────────────
  findBadgeDefinitions(guild: string): Promise<BadgeDefinition[]>;
  upsertBadgeDefinition(guild: string, badge: BadgeDefinition): Promise<void>;
  deleteBadgeDefinition(guild: string, badgeId: string): Promise<void>;
  findUserBadges(key: UserKey): Promise<BadgeRecord | null>;
  upsertUserBadges(key: UserKey, badges: BadgeRecord["badges"]): Promise<void>;

  // ─── Market ─────────────────────────────────────────
  addListing(listing: MarketListing): Promise<void>;
  removeListing(listingId: string): Promise<void>;
  findListing(listingId: string): Promise<MarketListing | null>;
  getGuildListings(guild: string): Promise<MarketListing[]>;
  getUserListings(user: string, guild: string): Promise<MarketListing[]>;
}
