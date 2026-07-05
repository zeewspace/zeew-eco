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
