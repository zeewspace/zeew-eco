import { Adapter } from "./adapter";
import {
  UserKey,
  GuildKey,
  MoneyRecord,
  StoreRecord,
  InventoryRecord,
  BankRecord,
} from "../types";

export class SqliteAdapter implements Adapter {
  private db: any;

  constructor(dbPath: string = "./zeew-eco.db") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Database = require("better-sqlite3");
      this.db = new Database(dbPath);
    } catch {
      throw new Error(
        "better-sqlite3 is required for SqliteAdapter. Install it: npm install better-sqlite3"
      );
    }
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS money (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        money INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, guild_id)
      );
      CREATE TABLE IF NOT EXISTS stores (
        guild_id TEXT PRIMARY KEY,
        items TEXT NOT NULL DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS inventory (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        items TEXT NOT NULL DEFAULT '[]',
        PRIMARY KEY (user_id, guild_id)
      );
      CREATE TABLE IF NOT EXISTS bank (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        money INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, guild_id)
      );
      CREATE TABLE IF NOT EXISTS cooldowns (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        PRIMARY KEY (user_id, guild_id, action)
      );
    `);
  }

  async findMoney(key: UserKey): Promise<MoneyRecord | null> {
    const row = this.db
      .prepare("SELECT money FROM money WHERE user_id = ? AND guild_id = ?")
      .get(key.user, key.guild);
    return row ? { ...key, money: row.money } : null;
  }

  async upsertMoney(key: UserKey, money: number): Promise<void> {
    this.db
      .prepare(
        "INSERT INTO money (user_id, guild_id, money) VALUES (?, ?, ?) ON CONFLICT(user_id, guild_id) DO UPDATE SET money = excluded.money"
      )
      .run(key.user, key.guild, money);
  }

  async deleteMoney(key: UserKey): Promise<void> {
    this.db
      .prepare("DELETE FROM money WHERE user_id = ? AND guild_id = ?")
      .run(key.user, key.guild);
  }

  async allMoney(guild: string): Promise<MoneyRecord[]> {
    const rows = this.db
      .prepare("SELECT user_id, guild_id, money FROM money WHERE guild_id = ?")
      .all(guild);
    return rows.map((r: any) => ({ user: r.user_id, guild: r.guild_id, money: r.money }));
  }

  async findStore(key: GuildKey): Promise<StoreRecord | null> {
    const row = this.db
      .prepare("SELECT items FROM stores WHERE guild_id = ?")
      .get(key.guild);
    return row ? { guild: key.guild, items: JSON.parse(row.items) } : null;
  }

  async upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void> {
    const json = JSON.stringify(items);
    this.db
      .prepare(
        "INSERT INTO stores (guild_id, items) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET items = excluded.items"
      )
      .run(key.guild, json);
  }

  async deleteStore(key: GuildKey): Promise<void> {
    this.db.prepare("DELETE FROM stores WHERE guild_id = ?").run(key.guild);
  }

  async findInventory(key: UserKey): Promise<InventoryRecord | null> {
    const row = this.db
      .prepare("SELECT items FROM inventory WHERE user_id = ? AND guild_id = ?")
      .get(key.user, key.guild);
    return row ? { ...key, inventory: JSON.parse(row.items) } : null;
  }

  async upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void> {
    const json = JSON.stringify(items);
    this.db
      .prepare(
        "INSERT INTO inventory (user_id, guild_id, items) VALUES (?, ?, ?) ON CONFLICT(user_id, guild_id) DO UPDATE SET items = excluded.items"
      )
      .run(key.user, key.guild, json);
  }

  async deleteInventory(key: UserKey): Promise<void> {
    this.db
      .prepare("DELETE FROM inventory WHERE user_id = ? AND guild_id = ?")
      .run(key.user, key.guild);
  }

  async findBank(key: UserKey): Promise<BankRecord | null> {
    const row = this.db
      .prepare("SELECT money FROM bank WHERE user_id = ? AND guild_id = ?")
      .get(key.user, key.guild);
    return row ? { ...key, money: row.money } : null;
  }

  async upsertBank(key: UserKey, money: number): Promise<void> {
    this.db
      .prepare(
        "INSERT INTO bank (user_id, guild_id, money) VALUES (?, ?, ?) ON CONFLICT(user_id, guild_id) DO UPDATE SET money = excluded.money"
      )
      .run(key.user, key.guild, money);
  }

  async deleteBank(key: UserKey): Promise<void> {
    this.db
      .prepare("DELETE FROM bank WHERE user_id = ? AND guild_id = ?")
      .run(key.user, key.guild);
  }

  async allBank(guild: string): Promise<BankRecord[]> {
    const rows = this.db
      .prepare("SELECT user_id, guild_id, money FROM bank WHERE guild_id = ?")
      .all(guild);
    return rows.map((r: any) => ({ user: r.user_id, guild: r.guild_id, money: r.money }));
  }

  async getCooldown(user: string, guild: string, action: string): Promise<number | null> {
    const row = this.db
      .prepare("SELECT timestamp FROM cooldowns WHERE user_id = ? AND guild_id = ? AND action = ?")
      .get(user, guild, action);
    return row?.timestamp ?? null;
  }

  async setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void> {
    this.db
      .prepare(
        "INSERT INTO cooldowns (user_id, guild_id, action, timestamp) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, guild_id, action) DO UPDATE SET timestamp = excluded.timestamp"
      )
      .run(user, guild, action, timestamp);
  }

  close(): void {
    this.db.close();
  }
}
