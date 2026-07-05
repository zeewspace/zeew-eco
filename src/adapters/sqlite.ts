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

export class SqliteAdapter implements Adapter {
  private db: any;

  constructor(dbPath: string = "./zeew-eco.db") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Database = require("better-sqlite3");
      this.db = new Database(dbPath);
    } catch {
      throw new Error("better-sqlite3 is required. Install: npm install better-sqlite3");
    }
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS money (user_id TEXT, guild_id TEXT, money INTEGER DEFAULT 0, currencies TEXT, PRIMARY KEY(user_id, guild_id));
      CREATE TABLE IF NOT EXISTS stores (guild_id TEXT PRIMARY KEY, items TEXT DEFAULT '[]');
      CREATE TABLE IF NOT EXISTS inventory (user_id TEXT, guild_id TEXT, items TEXT DEFAULT '[]', PRIMARY KEY(user_id, guild_id));
      CREATE TABLE IF NOT EXISTS bank (user_id TEXT, guild_id TEXT, money INTEGER DEFAULT 0, PRIMARY KEY(user_id, guild_id));
      CREATE TABLE IF NOT EXISTS cooldowns (user_id TEXT, guild_id TEXT, action TEXT, timestamp INTEGER, PRIMARY KEY(user_id, guild_id, action));
      CREATE TABLE IF NOT EXISTS daily (user_id TEXT, guild_id TEXT, lastClaim INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, PRIMARY KEY(user_id, guild_id));
      CREATE TABLE IF NOT EXISTS transactions (id TEXT, type TEXT, amount REAL, currency TEXT, timestamp INTEGER, meta TEXT, guild_id TEXT);
      CREATE TABLE IF NOT EXISTS badge_defs (guild_id TEXT, id TEXT, name TEXT, description TEXT, icon TEXT, PRIMARY KEY(guild_id, id));
      CREATE TABLE IF NOT EXISTS user_badges (user_id TEXT, guild_id TEXT, badges TEXT DEFAULT '[]', PRIMARY KEY(user_id, guild_id));
      CREATE TABLE IF NOT EXISTS listings (id TEXT PRIMARY KEY, seller TEXT, guild_id TEXT, itemName TEXT, item TEXT, price REAL, currency TEXT, createdAt INTEGER);
      CREATE INDEX IF NOT EXISTS idx_txn_guild_user ON transactions(guild_id, meta);
    `);
  }

  private rowToMoney(r: any): MoneyRecord {
    return { user: r.user_id, guild: r.guild_id, money: r.money, currencies: r.currencies ? JSON.parse(r.currencies) : undefined };
  }

  // ─── Money ───────────────────────────────────────────

  async findMoney(key: UserKey): Promise<MoneyRecord | null> {
    const r = this.db.prepare("SELECT * FROM money WHERE user_id=? AND guild_id=?").get(key.user, key.guild);
    return r ? this.rowToMoney(r) : null;
  }

  async upsertMoney(key: UserKey, money: number, currencies?: Record<string, number>): Promise<void> {
    const c = currencies ? JSON.stringify(currencies) : null;
    this.db.prepare("INSERT INTO money(user_id,guild_id,money,currencies) VALUES(?,?,?,?) ON CONFLICT(user_id,guild_id) DO UPDATE SET money=excluded.money, currencies=excluded.currencies").run(key.user, key.guild, money, c);
  }

  async deleteMoney(key: UserKey): Promise<void> {
    this.db.prepare("DELETE FROM money WHERE user_id=? AND guild_id=?").run(key.user, key.guild);
  }

  async allMoney(guild: string): Promise<MoneyRecord[]> {
    return this.db.prepare("SELECT * FROM money WHERE guild_id=?").all(guild).map(this.rowToMoney);
  }

  // ─── Store ───────────────────────────────────────────

  async findStore(key: GuildKey): Promise<StoreRecord | null> {
    const r = this.db.prepare("SELECT * FROM stores WHERE guild_id=?").get(key.guild);
    return r ? { guild: r.guild_id, items: JSON.parse(r.items) } : null;
  }

  async upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void> {
    this.db.prepare("INSERT INTO stores(guild_id,items) VALUES(?,?) ON CONFLICT(guild_id) DO UPDATE SET items=excluded.items").run(key.guild, JSON.stringify(items));
  }

  async deleteStore(key: GuildKey): Promise<void> {
    this.db.prepare("DELETE FROM stores WHERE guild_id=?").run(key.guild);
  }

  // ─── Inventory ───────────────────────────────────────

  async findInventory(key: UserKey): Promise<InventoryRecord | null> {
    const r = this.db.prepare("SELECT * FROM inventory WHERE user_id=? AND guild_id=?").get(key.user, key.guild);
    return r ? { user: r.user_id, guild: r.guild_id, inventory: JSON.parse(r.items) } : null;
  }

  async upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void> {
    this.db.prepare("INSERT INTO inventory(user_id,guild_id,items) VALUES(?,?,?) ON CONFLICT(user_id,guild_id) DO UPDATE SET items=excluded.items").run(key.user, key.guild, JSON.stringify(items));
  }

  async deleteInventory(key: UserKey): Promise<void> {
    this.db.prepare("DELETE FROM inventory WHERE user_id=? AND guild_id=?").run(key.user, key.guild);
  }

  // ─── Bank ────────────────────────────────────────────

  async findBank(key: UserKey): Promise<BankRecord | null> {
    const r = this.db.prepare("SELECT * FROM bank WHERE user_id=? AND guild_id=?").get(key.user, key.guild);
    return r ? { user: r.user_id, guild: r.guild_id, money: r.money } : null;
  }

  async upsertBank(key: UserKey, money: number): Promise<void> {
    this.db.prepare("INSERT INTO bank(user_id,guild_id,money) VALUES(?,?,?) ON CONFLICT(user_id,guild_id) DO UPDATE SET money=excluded.money").run(key.user, key.guild, money);
  }

  async deleteBank(key: UserKey): Promise<void> {
    this.db.prepare("DELETE FROM bank WHERE user_id=? AND guild_id=?").run(key.user, key.guild);
  }

  async allBank(guild: string): Promise<BankRecord[]> {
    return this.db.prepare("SELECT * FROM bank WHERE guild_id=?").all(guild).map((r: any) => ({ user: r.user_id, guild: r.guild_id, money: r.money }));
  }

  // ─── Cooldowns ──────────────────────────────────────

  async getCooldown(user: string, guild: string, action: string): Promise<number | null> {
    const r = this.db.prepare("SELECT timestamp FROM cooldowns WHERE user_id=? AND guild_id=? AND action=?").get(user, guild, action);
    return r?.timestamp ?? null;
  }

  async setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void> {
    this.db.prepare("INSERT INTO cooldowns(user_id,guild_id,action,timestamp) VALUES(?,?,?,?) ON CONFLICT(user_id,guild_id,action) DO UPDATE SET timestamp=excluded.timestamp").run(user, guild, action, timestamp);
  }

  // ─── Daily ──────────────────────────────────────────

  async findDaily(key: UserKey): Promise<DailyRecord | null> {
    const r = this.db.prepare("SELECT * FROM daily WHERE user_id=? AND guild_id=?").get(key.user, key.guild);
    return r ? { user: r.user_id, guild: r.guild_id, lastClaim: r.lastClaim, streak: r.streak } : null;
  }

  async upsertDaily(key: UserKey, record: DailyRecord): Promise<void> {
    this.db.prepare("INSERT INTO daily(user_id,guild_id,lastClaim,streak) VALUES(?,?,?,?) ON CONFLICT(user_id,guild_id) DO UPDATE SET lastClaim=excluded.lastClaim, streak=excluded.streak").run(key.user, key.guild, record.lastClaim, record.streak);
  }

  // ─── History ────────────────────────────────────────

  async addTransaction(_guild: string, entry: TransactionEntry): Promise<void> {
    this.db.prepare("INSERT INTO transactions(id,type,amount,currency,timestamp,meta,guild_id) VALUES(?,?,?,?,?,?,?)").run(entry.id, entry.type, entry.amount, entry.currency, entry.timestamp, JSON.stringify(entry.meta ?? {}));
  }

  async getTransactions(user: string, guild: string, limit: number = 20): Promise<TransactionEntry[]> {
    const rows = this.db.prepare("SELECT * FROM transactions WHERE guild_id=? AND json_extract(meta,'$.user')=? ORDER BY timestamp DESC LIMIT ?").all(guild, user, limit);
    return rows.map((r: any) => ({ id: r.id, type: r.type, amount: r.amount, currency: r.currency, timestamp: r.timestamp, meta: JSON.parse(r.meta) }));
  }

  // ─── Badges ─────────────────────────────────────────

  async findBadgeDefinitions(guild: string): Promise<BadgeDefinition[]> {
    return this.db.prepare("SELECT * FROM badge_defs WHERE guild_id=?").all(guild).map((r: any) => ({ id: r.id, name: r.name, description: r.description, icon: r.icon }));
  }

  async upsertBadgeDefinition(guild: string, badge: BadgeDefinition): Promise<void> {
    this.db.prepare("INSERT INTO badge_defs(guild_id,id,name,description,icon) VALUES(?,?,?,?,?) ON CONFLICT(guild_id,id) DO UPDATE SET name=excluded.name, description=excluded.description, icon=excluded.icon").run(guild, badge.id, badge.name, badge.description, badge.icon);
  }

  async deleteBadgeDefinition(guild: string, badgeId: string): Promise<void> {
    this.db.prepare("DELETE FROM badge_defs WHERE guild_id=? AND id=?").run(guild, badgeId);
  }

  async findUserBadges(key: UserKey): Promise<BadgeRecord | null> {
    const r = this.db.prepare("SELECT * FROM user_badges WHERE user_id=? AND guild_id=?").get(key.user, key.guild);
    return r ? { user: r.user_id, guild: r.guild_id, badges: JSON.parse(r.badges) } : null;
  }

  async upsertUserBadges(key: UserKey, badges: BadgeRecord["badges"]): Promise<void> {
    this.db.prepare("INSERT INTO user_badges(user_id,guild_id,badges) VALUES(?,?,?) ON CONFLICT(user_id,guild_id) DO UPDATE SET badges=excluded.badges").run(key.user, key.guild, JSON.stringify(badges));
  }

  // ─── Market ─────────────────────────────────────────

  async addListing(listing: MarketListing): Promise<void> {
    this.db.prepare("INSERT INTO listings(id,seller,guild_id,itemName,item,price,currency,createdAt) VALUES(?,?,?,?,?,?,?,?)").run(listing.id, listing.seller, listing.guild, listing.itemName, listing.item, listing.price, listing.currency, listing.createdAt);
  }

  async removeListing(listingId: string): Promise<void> {
    this.db.prepare("DELETE FROM listings WHERE id=?").run(listingId);
  }

  async findListing(listingId: string): Promise<MarketListing | null> {
    const r = this.db.prepare("SELECT * FROM listings WHERE id=?").get(listingId);
    return r ? { id: r.id, seller: r.seller, guild: r.guild_id, itemName: r.itemName, item: r.item, price: r.price, currency: r.currency, createdAt: r.createdAt } : null;
  }

  async getGuildListings(guild: string): Promise<MarketListing[]> {
    return this.db.prepare("SELECT * FROM listings WHERE guild_id=?").all(guild).map((r: any) => ({ id: r.id, seller: r.seller, guild: r.guild_id, itemName: r.itemName, item: r.item, price: r.price, currency: r.currency, createdAt: r.createdAt }));
  }

  async getUserListings(user: string, guild: string): Promise<MarketListing[]> {
    return this.db.prepare("SELECT * FROM listings WHERE seller=? AND guild_id=?").all(user, guild).map((r: any) => ({ id: r.id, seller: r.seller, guild: r.guild_id, itemName: r.itemName, item: r.item, price: r.price, currency: r.currency, createdAt: r.createdAt }));
  }

  close(): void {
    this.db.close();
  }
}
