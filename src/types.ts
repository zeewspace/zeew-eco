// ─── Base Keys ───────────────────────────────────────────

export interface UserKey {
  user: string;
  guild: string;
}

export interface GuildKey {
  guild: string;
}

// ─── Core Records ────────────────────────────────────────

export interface MoneyRecord extends UserKey {
  money: number;
  currencies?: Record<string, number>;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  item: string | null;
  stock?: number | null;
  currency?: string;
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

// ─── Core Results ────────────────────────────────────────

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

// ─── Daily Rewards ───────────────────────────────────────

export interface DailyRecord extends UserKey {
  lastClaim: number;
  streak: number;
}

export interface DailyResult {
  earned: number;
  streak: number;
  total: number;
}

export interface DailyCooldownResult {
  error: "already_claimed";
  nextIn: number;
  streak: number;
}

// ─── Transaction History ─────────────────────────────────

export interface TransactionEntry {
  id: string;
  type: string;
  amount: number;
  currency: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

// ─── Badges ──────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string | null;
}

export interface UserBadge {
  badgeId: string;
  awardedAt: number;
}

export interface BadgeRecord extends UserKey {
  badges: UserBadge[];
}

// ─── Market ──────────────────────────────────────────────

export interface MarketListing {
  id: string;
  seller: string;
  guild: string;
  itemName: string;
  item: string | null;
  price: number;
  currency: string;
  createdAt: number;
}

// ─── Logger & Hooks ──────────────────────────────────────

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
  onDaily?: (user: string, guild: string, earned: number, streak: number) => void;
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

// ─── Module Options ──────────────────────────────────────

export interface ModuleOptions {
  logger?: Logger;
}

export interface EconomyOptions extends ModuleOptions {
  hooks?: EconomyHooks;
  currencies?: string[];
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

export interface DailyOptions extends ModuleOptions {
  baseReward?: number;
  streakBonus?: number;
  maxStreak?: number;
}

export interface BadgesOptions extends ModuleOptions {}

export interface MarketOptions extends ModuleOptions {
  feePercent?: number;
}
