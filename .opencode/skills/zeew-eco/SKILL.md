---
name: zeew-eco
description: "Trigger: zeew-eco, economy, Discord economy, wallet, bank, store, inventory, daily, badges, marketplace, adapters, zeew. Build, extend, migrate, or debug Discord bot economies with zeew-eco v3.2+."
license: PolyForm-Noncommercial-1.0.0
metadata:
  author: zeew
  version: "1.0"
---

# zeew-eco — Complete Agent Reference

## Mental Model

zeew-eco is a **stateless business logic layer** over a pluggable `Adapter`. Every module (Economy, Store, Inventory, Bank, Daily, Badges, Market) is a thin class that takes an Adapter instance. Modules compute, adapter persists. Modules never touch storage directly.

```
User Code → Module (Economy/Store/etc) → Adapter Interface → Storage (JSON/SQLite/Mongo/Redis)
```

**Critical invariant**: All methods are async. Errors return `{ error: string }` objects — never throw. Every operation is scoped by `(user, guild)` pair except Store which is guild-only.

## Architecture

### Adapter (30 methods)

The contract every storage backend must implement:

| Group | Methods |
|-------|---------|
| Money (4) | `findMoney`, `upsertMoney(key, money, currencies?)`, `deleteMoney`, `allMoney(guild)` |
| Store (3) | `findStore`, `upsertStore(guild, items)`, `deleteStore` |
| Inventory (3) | `findInventory`, `upsertInventory(key, items)`, `deleteInventory` |
| Bank (4) | `findBank`, `upsertBank`, `deleteBank`, `allBank(guild)` |
| Cooldowns (2) | `getCooldown(user, guild, action) → number\|null`, `setCooldown(user, guild, action, timestamp)` |
| Daily (2) | `findDaily(key) → DailyRecord\|null`, `upsertDaily(key, record)` |
| History (2) | `addTransaction(guild, entry)`, `getTransactions(user, guild, limit?)` |
| Badges (5) | `findBadgeDefinitions(guild)`, `upsertBadgeDefinition(guild, badge)`, `deleteBadgeDefinition(guild, badgeId)`, `findUserBadges(key)`, `upsertUserBadges(key, badges)` |
| Market (5) | `addListing(listing)`, `removeListing(listingId)`, `findListing(listingId)`, `getGuildListings(guild)`, `getUserListings(user, guild)` |

### Built-in Adapters

| Adapter | Import | Peer Dep | Constructor | Notes |
|---------|--------|----------|-------------|-------|
| `JsonAdapter` | `zeew-eco` | None | `(filePath?: "./zeew-eco.json")` | Writes on every mutation. Not thread-safe. Trims history at 10K entries. |
| `SqliteAdapter` | `zeew-eco` | `better-sqlite3` | `(dbPath?: "./zeew-eco.db")` | Synchronous internals wrapped in async. Has extra `close()` method. |
| `MemoryAdapter` | `zeew-eco` | None | `()` | In-memory arrays+Maps. Deep-copies on reads. Has `reset()` method. |
| `MongoAdapter` | `zeew-eco` | `mongodb` | `(db: Db)` | Creates indexes on init. Collections prefixed `eco_`. |
| `RedisAdapter` | `zeew-eco` | `ioredis` | `(client, prefix?: "zeew:")` | JSON-serialized values. Uses sets for guild membership tracking. |

**Known quirks to communicate**:
- MongoAdapter: cooldowns and daily share `eco_daily` collection — avoid action name `"daily"`
- RedisAdapter: `addTransaction` keys by `meta.user` — if undefined, key becomes `txns:{guild}:undefined`
- RedisAdapter: `deleteBadgeDefinition` is non-atomic (read-filter-delete-readd)
- JsonAdapter: filters transactions by `meta.user` + `meta.guild`, ignores the `guild` function param
- SqliteAdapter: filters transactions by `guild_id` column AND `json_extract(meta, '$.user')`

## Module API

### Economy (wallet)

```
constructor(adapter: Adapter, options?: EconomyOptions)
  options: { logger?, hooks?: EconomyHooks, currencies?: string[] }

get(user, guild, currency?) → number                          // 0 if no record
add(user, guild, amount, currency?) → number                  // new balance
remove(user, guild, amount, currency?) → number               // new balance (floors at 0)
reset(user, guild) → boolean                                  // deletes record
buy(user, guild, itemId) → BuyResult | { error }              // deducts + adds to inventory
work(user, guild, maxEarnings, { cooldown? }) → WorkResult | WorkCooldownResult
transfer(from, to, guild, amount, currency?) → TransferResult | { error }
bulkAdd(items: BulkItem[]) → number                           // count processed
leaderboard(guild, limit?) → LeaderboardEntry[]               // sorted desc by money
history(user, guild, { limit? }) → TransactionEntry[]         // default limit 20
```

**buy() flow**: Checks store exists → user exists → item exists → balance ≥ price → stock > 0 → deducts balance → decrements stock → adds to inventory → logs transaction.

**work() flow**: If cooldown set, checks last timestamp → if within cooldown, returns `{ error: "cooldown", retryIn: ms }` → else earns random [0, maxEarnings) → adds to balance → sets cooldown timestamp → logs.

**transfer() flow**: Checks sender exists → balance ≥ amount → computes new balances → upserts both → logs 2 transactions (debit+credit).

**Multi-currency**: When `currency` param is provided and ≠ `"default"`, operates on `record.currencies[currency]` instead of `record.money`. Default currency is always `"default"` string.

**buy() with stock**: `item.stock` is `number | null`. If `null` → unlimited. If `≤ 0` → returns `out_of_stock`. If `> 0` → decrements after purchase.

### Store (catalog)

```
constructor(adapter: Adapter, options?: StoreOptions)
  options: { logger?, hooks?: StoreHooks }

get(guild) → StoreItem[]
add(guild, name, description, price, item?, { stock?, currency? }) → StoreItem
remove(guild, itemId) → boolean                               // false if not found
reset(guild) → boolean
setStock(guild, itemId, stock | null) → boolean               // update after creation
```

StoreItem: `{ id, name, description, price, item: string|null, stock?: number|null, currency?: string }`

The `id` is auto-generated. The `item` field is optional metadata (e.g., role ID to assign). `currency` defaults to `"default"`.

### Inventory (purchased items)

```
constructor(adapter: Adapter, options?: InventoryOptions)
  options: { logger?, hooks?: InventoryHooks }

get(user, guild) → InventoryItem[]
getItem(user, guild, itemId) → InventoryItem | null
add(user, guild, name, item?) → InventoryItem
remove(user, guild, itemId) → boolean
reset(user, guild) → boolean
```

InventoryItem: `{ id: string, name: string, item: string|null }`

### Bank

```
constructor(adapter: Adapter, options?: BankOptions)
  options: { logger?, hooks?: BankHooks }

get(user, guild) → number
add(user, guild, amount) → number
remove(user, guild, amount) → number                         // floors at 0
reset(user, guild) → boolean
deposit(user, guild, amount) → DepositResult | { error }     // economy→bank
withdraw(user, guild, amount) → WithdrawResult | { error }   // bank→economy
leaderboard(guild, limit?) → LeaderboardEntry[]
```

**deposit flow**: Checks economy record exists → economy balance ≥ amount → upserts both bank and money atomically.

**withdraw flow**: Checks bank exists → bank balance ≥ amount → upserts both. If no money record, creates one with 0+amount.

### Daily

```
constructor(adapter: Adapter, options?: DailyOptions)
  options: { logger?, baseReward?: 100, streakBonus?: 10, maxStreak?: 365 }

claim(user, guild) → DailyResult | DailyCooldownResult
getStreak(user, guild) → number
```

**Streak logic**:
- No record → streak=1, earned=baseReward
- Elapsed < 24h → `{ error: "already_claimed", nextIn: ms, streak }`
- 24h < elapsed < 48h → consecutive, streak++, earned=base+(streak-1)*bonus
- elapsed > 48h → streak resets to 1
- Streak capped at maxStreak

**DailyResult**: `{ earned: number, streak: number, total: number }` (total = new wallet balance)

### Badges

```
constructor(adapter: Adapter, options?: BadgesOptions)

define(guild, id, name, description, icon?) → BadgeDefinition
list(guild) → BadgeDefinition[]
undefine(guild, badgeId) → boolean
award(user, guild, badgeId) → UserBadge | { error }
get(user, guild) → UserBadge[]
has(user, guild, badgeId) → boolean
remove(user, guild, badgeId) → boolean
count(user, guild) → number
```

**award errors**: `badge_not_found` (badge not defined in guild), `already_awarded` (user already has it).

**undefine behavior**: Removes the definition. Does NOT remove from users who already have it (orphaned badges possible).

### Market

```
constructor(adapter: Adapter, options?: MarketOptions)
  options: { logger?, feePercent?: 5 }

list(seller, guild, itemName, price, { item?, currency? }) → MarketListing
buy(buyer, guild, listingId) → { listing, fee } | { error }
cancel(user, guild, listingId) → boolean
getGuildListings(guild) → MarketListing[]
getUserListings(user, guild) → MarketListing[]
```

**buy flow**: Checks listing exists → buyer ≠ seller → buyer balance ≥ price → computes fee = floor(price × feePercent/100) → deducts buyer → pays seller (price - fee) → removes listing.

**MarketListing**: `{ id, seller, guild, itemName, item, price, currency, createdAt }`

**buy errors**: `listing_not_found`, `cannot_buy_own_listing`, `insufficient_funds`

## Error Handling Pattern

Every operation that can fail returns an error object instead of throwing. Always check with `"error" in result`:

```typescript
const result = await eco.buy(user, guild, itemId);
if ("error" in result) {
  // handle: result.error is the string
} else {
  // success: result.item, result.money, result.newMoney
}
```

**Complete error string inventory (18 errors)**:

| Module | Error | When |
|--------|-------|------|
| Economy.buy | `store_not_found` | No store items for guild |
| Economy.buy | `user_not_found` | No money record for user |
| Economy.buy | `item_not_found` | itemId not in store |
| Economy.buy | `insufficient_funds` | Balance < item price |
| Economy.buy | `out_of_stock` | stock ≤ 0 |
| Economy.work | `cooldown` | Within cooldown period |
| Economy.transfer | `sender_not_found` | No money record for sender |
| Economy.transfer | `insufficient_funds` | Sender balance < amount |
| Bank.deposit | `economy_not_found` | No money record |
| Bank.deposit | `insufficient_funds` | Economy balance < amount |
| Bank.withdraw | `bank_not_found` | No bank record |
| Bank.withdraw | `insufficient_funds` | Bank balance < amount |
| Daily.claim | `already_claimed` | Claimed within 24h |
| Badges.award | `badge_not_found` | Badge not defined in guild |
| Badges.award | `already_awarded` | User already has badge |
| Market.buy | `listing_not_found` | Listing doesn't exist |
| Market.buy | `cannot_buy_own_listing` | Buyer is seller |
| Market.buy | `insufficient_funds` | Buyer balance < price |

**Operations that never error** (always succeed, return boolean): `Store.remove`, `Store.reset`, `Inventory.remove`, `Inventory.reset`, `Bank.reset`, `Economy.reset`, `Badges.undefine`, `Badges.remove`, `Market.cancel`.

## Hooks

Every module (except Daily, Badges, Market) supports hooks via options. Hooks are synchronous callbacks fired after the operation completes:

```typescript
new Economy(adapter, {
  hooks: {
    onBalanceChange: (user, guild, oldBal, newBal) => void,  // fires on add, remove, buy, transfer
    onPurchase: (user, guild, item: StoreItem) => void,       // fires on buy
    onTransfer: (from, to, guild, amount) => void,            // fires on transfer
    onWork: (user, guild, earned) => void,                    // fires on work
  }
});

new Store(adapter, {
  hooks: {
    onItemAdded: (guild, item) => void,
    onItemRemoved: (guild, itemId) => void,
  }
});

new Bank(adapter, {
  hooks: {
    onBalanceChange: (user, guild, oldBal, newBal) => void,   // fires on add, remove, deposit, withdraw
    onDeposit: (user, guild, amount) => void,
    onWithdraw: (user, guild, amount) => void,
  }
});
```

**Known gap**: `EconomyHooks.onDaily` is declared in types but never fired by any module. Daily class does not accept hooks.

## Logger

All modules accept `{ logger: Logger }` where Logger has `info/warn/error/debug` methods (compatible with `console`, `pino`, `winston`):

```typescript
new Economy(adapter, { logger: console });
// Output: [Economy] add 100 to user1@guild1 → 600
```

## Multi-Currency

Default currency is always `"default"` string (stored in `record.money`). Custom currencies live in `record.currencies` (a `Record<string, number>`):

```typescript
const eco = new Economy(adapter);
await eco.add(user, guild, 100);                    // default currency
await eco.add(user, guild, 50, "gems");             // custom currency
await eco.get(user, guild, "gems");                 // 50
await eco.get(user, guild);                         // 100 (default)
await eco.transfer(a, b, guild, 20, "gems");        // custom currency transfer
await store.add(g, "Sword", "desc", 500, null, { currency: "gems" });
await eco.buy(user, g, swordItem.id);               // pays in gems
```

**Limitations**: `Bank.deposit/withdraw` only works with default currency. `leaderboard` only ranks by default currency balance.

## Transaction History

Every `add`, `remove`, `buy`, `transfer`, and `work` call logs a `TransactionEntry`:

```typescript
{ id: string, type: string, amount: number, currency: string, timestamp: number, meta: Record }
```

Types logged: `"add"`, `"remove"`, `"buy"`, `"transfer"`, `"work"` (via add).

Meta always includes `{ user, guild }` plus operation-specific fields:
- buy: `{ itemId, itemName }`
- transfer: `{ to/from, amount }`
- add/remove: `{ amount, currency }`

```typescript
const log = await eco.history(user, guild, { limit: 50 });
```

## Migration from v1 (MongoDB)

```typescript
import { migrateFromV1, JsonAdapter } from "zeew-eco";

// Export MongoDB collections as JSON arrays first
const data = {
  economy: [{ user, guild, money }],
  stores: [{ guild, store: [{ id, name, description?, price, item? }] }],
  inventory: [{ user, guild, inventory: [{ id, name, item? }] }],
  bank: [{ user, guild, money }],
};

const adapter = new JsonAdapter("./migrated.json");
const result = await migrateFromV1(adapter, data);
// { economy: 150, stores: 3, inventory: 89, bank: 42 }
```

**Note**: v1 used Spanish names (`Economia`, `ver`, `agregar`, `comprar`, `trabajar`). v3 uses English (`Economy`, `get`, `add`, `buy`, `work`). v1 field `store` maps to v3 `items`.

## Creating a Custom Adapter

Implement all 30 methods from `Adapter`. Critical behaviors to match:

1. `findMoney/Store/Inventory/Bank` return `null` when not found — never undefined
2. `upsertMoney` accepts optional `currencies` param — if provided, must store it
3. `allMoney/allBank` must return ONLY records for the given guild
4. `getCooldown` returns `null` when no cooldown set, otherwise the timestamp (number)
5. `getTransactions` returns entries sorted by timestamp ascending, limited by param
6. `addTransaction` should persist the full `TransactionEntry` including `meta`
7. `findBadgeDefinitions` returns only definitions for the guild
8. `findUserBadges` returns the user's badge array (may be empty via null check)
9. `getGuildListings` and `getUserListings` are filtered differently (guild vs seller+guild)

**Recommended pattern**: Copy `MemoryAdapter` from `src/adapters/memory.ts` and replace storage with your database calls.

## Testing

```bash
npm test              # 136 tests (vitest)
npm run test:watch    # Watch mode
npx tsc --noEmit      # Type check
```

Tests use `MockAdapter` (structurally identical to MemoryAdapter). E2E tests use `JsonAdapter` with real file I/O.

## Anti-patterns to Avoid

1. **Don't assume sync** — every adapter method is async, even MemoryAdapter
2. **Don't throw** — always check `"error" in result`
3. **Don't use negative amounts** — no validation exists, will corrupt balances
4. **Don't mix cooldowns with Daily** — MongoAdapter shares collection, use different action names
5. **Don't read after write** — MockAdapter returns references, compute values before calling upsert
6. **Don't assume Bank works with custom currencies** — deposit/withdraw only check `record.money`
7. **Don't rely on `onDaily` hook** — it's declared in types but never fired
