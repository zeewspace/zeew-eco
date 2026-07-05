import {
  UserKey,
  GuildKey,
  MoneyRecord,
  StoreRecord,
  InventoryRecord,
  BankRecord,
} from "../types";

export interface Adapter {
  findMoney(key: UserKey): Promise<MoneyRecord | null>;
  upsertMoney(key: UserKey, money: number): Promise<void>;
  deleteMoney(key: UserKey): Promise<void>;
  allMoney(guild: string): Promise<MoneyRecord[]>;

  findStore(key: GuildKey): Promise<StoreRecord | null>;
  upsertStore(key: GuildKey, items: StoreRecord["items"]): Promise<void>;
  deleteStore(key: GuildKey): Promise<void>;

  findInventory(key: UserKey): Promise<InventoryRecord | null>;
  upsertInventory(key: UserKey, items: InventoryRecord["inventory"]): Promise<void>;
  deleteInventory(key: UserKey): Promise<void>;

  findBank(key: UserKey): Promise<BankRecord | null>;
  upsertBank(key: UserKey, money: number): Promise<void>;
  deleteBank(key: UserKey): Promise<void>;
  allBank(guild: string): Promise<BankRecord[]>;

  getCooldown(user: string, guild: string, action: string): Promise<number | null>;
  setCooldown(user: string, guild: string, action: string, timestamp: number): Promise<void>;
}
