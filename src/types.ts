export interface UserKey {
  user: string;
  guild: string;
}

export interface GuildKey {
  guild: string;
}

export interface MoneyRecord extends UserKey {
  money: number;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  item: string | null;
}

export interface StoreRecord extends GuildKey {
  items: StoreItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  item: string | null;
}

export interface InventoryRecord extends UserKey {
  inventory: InventoryItem[];
}

export interface BankRecord extends UserKey {
  money: number;
}

export interface BuyResult {
  item: StoreItem;
  money: number;
  newMoney: number;
}

export interface DepositResult {
  economy: number;
  bank: number;
}

export interface WithdrawResult {
  economy: number;
  bank: number;
}

export interface TransferResult {
  from: number;
  to: number;
  amount: number;
}

export interface LeaderboardEntry {
  user: string;
  guild: string;
  money: number;
}

export interface WorkResult {
  earned: number;
}

export interface WorkCooldownResult {
  error: "cooldown";
  retryIn: number;
}

export interface BulkItem {
  user: string;
  guild: string;
  amount: number;
}

export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

export interface EconomyHooks {
  onBalanceChange?: (user: string, guild: string, oldBalance: number, newBalance: number) => void;
  onPurchase?: (user: string, guild: string, item: StoreItem) => void;
  onTransfer?: (from: string, to: string, guild: string, amount: number) => void;
  onWork?: (user: string, guild: string, earned: number) => void;
}

export interface StoreHooks {
  onItemAdded?: (guild: string, item: StoreItem) => void;
  onItemRemoved?: (guild: string, itemId: string) => void;
}

export interface InventoryHooks {
  onItemAdded?: (user: string, guild: string, item: InventoryItem) => void;
  onItemRemoved?: (user: string, guild: string, itemId: string) => void;
}

export interface BankHooks {
  onBalanceChange?: (user: string, guild: string, oldBalance: number, newBalance: number) => void;
  onDeposit?: (user: string, guild: string, amount: number) => void;
  onWithdraw?: (user: string, guild: string, amount: number) => void;
}

export interface ModuleOptions {
  logger?: Logger;
}

export interface EconomyOptions extends ModuleOptions {
  hooks?: EconomyHooks;
}

export interface StoreOptions extends ModuleOptions {
  hooks?: StoreHooks;
}

export interface InventoryOptions extends ModuleOptions {
  hooks?: InventoryHooks;
}

export interface BankOptions extends ModuleOptions {
  hooks?: BankHooks;
}
