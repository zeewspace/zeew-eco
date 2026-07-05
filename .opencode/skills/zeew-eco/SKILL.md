---
name: zeew-eco
description: "Trigger: zeew-eco, economy, Discord economy, wallet, bank, store, inventory, daily, badges, marketplace, adapters. Build, extend, or debug Discord bot economies using zeew-eco."
license: PolyForm-Noncommercial-1.0.0
metadata:
  author: zeew
  version: "1.0"
---

# zeew-eco Skill

Complete reference for building Discord bot economies with zeew-eco v3.2+.

## Architecture

All storage goes through the `Adapter` interface (30 methods). Modules never touch files or databases directly. Every method is async. Errors return `{ error: string }`, never throw.

```
Economy  → Adapter → { JsonAdapter | SqliteAdapter | MemoryAdapter | MongoAdapter | RedisAdapter }
Store    → Adapter
Inventory → Adapter
Bank     → Adapter
Daily    → Adapter
Badges   → Adapter
Market   → Adapter
```

## Quick Setup

```typescript
import { Economy, Store, Inventory, Bank, JsonAdapter } from "zeew-eco";
const adapter = new JsonAdapter("./data.json");
const eco = new Economy(adapter, { logger: console });
```

## Module Reference

### Economy
- `get(user, guild, currency?)` → number
- `add(user, guild, amount, currency?)` → number
- `remove(user, guild, amount, currency?)` → number
- `reset(user, guild)` → boolean
- `buy(user, guild, itemId)` → BuyResult | { error }
- `work(user, guild, max, { cooldown? })` → WorkResult | WorkCooldownResult
- `transfer(from, to, guild, amount, currency?)` → TransferResult | { error }
- `bulkAdd(items: BulkItem[])` → number
- `leaderboard(guild, limit?)` → LeaderboardEntry[]
- `history(user, guild, { limit? })` → TransactionEntry[]

### Store
- `get(guild)` → StoreItem[]
- `add(guild, name, desc, price, item?, { stock?, currency? })` → StoreItem
- `remove(guild, itemId)` → boolean
- `reset(guild)` → boolean
- `setStock(guild, itemId, stock | null)` → boolean

### Bank
- `get/add/remove/reset/deposit/withdraw/leaderboard` — same pattern as Economy

### Daily
- `claim(user, guild)` → DailyResult | DailyCooldownResult
- `getStreak(user, guild)` → number
- Options: `{ baseReward?, streakBonus?, maxStreak? }`

### Badges
- `define(guild, id, name, desc, icon?)` → BadgeDefinition
- `award(user, guild, badgeId)` → UserBadge | { error }
- `get(user, guild)` → UserBadge[]
- `has(user, guild, badgeId)` → boolean
- `remove(user, guild, badgeId)` → boolean
- `count(user, guild)` → number

### Market
- `list(seller, guild, itemName, price, { item?, currency? })` → MarketListing
- `buy(buyer, guild, listingId)` → { listing, fee } | { error }
- `cancel(user, guild, listingId)` → boolean
- Options: `{ feePercent? }`

## Multi-Currency

```typescript
await eco.add(user, guild, 100, "gems");
await eco.get(user, guild, "gold");
await eco.transfer(a, b, guild, 50, "tokens");
await store.add(g, "Item", "Desc", 500, null, { currency: "gems" });
```

## Hooks

```typescript
new Economy(adapter, { hooks: { onBalanceChange, onPurchase, onTransfer, onWork, onDaily } });
new Store(adapter, { hooks: { onItemAdded, onItemRemoved } });
new Bank(adapter, { hooks: { onDeposit, onWithdraw } });
```

## Adapters

| Adapter | Import | Peer Dep |
|---------|--------|----------|
| JsonAdapter | `zeew-eco` | None |
| SqliteAdapter | `zeew-eco` | better-sqlite3 |
| MemoryAdapter | `zeew-eco` | None |
| MongoAdapter | `zeew-eco` | mongodb |
| RedisAdapter | `zeew-eco` | ioredis |

## Custom Adapter

Implement all 30 methods from the `Adapter` interface. See `src/adapters/adapter.ts` for the full contract.

## Migration from v1

```typescript
import { migrateFromV1, JsonAdapter } from "zeew-eco";
await migrateFromV1(new JsonAdapter("./migrated.json"), {
  economy: require("./export-economia.json"),
  stores: require("./export-store.json"),
  inventory: require("./export-inventory.json"),
  bank: require("./export-banco.json"),
});
```

## Testing

```bash
npm test              # 136 tests (vitest)
npm run test:watch    # Watch mode
npx tsc --noEmit      # Type check
```
