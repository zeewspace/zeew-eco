# zeew-eco

> Standalone, database-agnostic economy system for Discord bots. TypeScript, zero runtime dependencies, pluggable storage backends.

[![CI](https://github.com/zeewdev/zeew-eco/actions/workflows/ci.yml/badge.svg)](https://github.com/zeewdev/zeew-eco/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/zeew-eco)](https://www.npmjs.com/package/zeew-eco)
[![license](https://img.shields.io/npm/l/zeew-eco)](./LICENSE)

## What is this?

zeew-eco provides a complete economy system — wallet, bank, store, inventory — for Discord bots. It is **database-agnostic**: bring your own storage backend via the `Adapter` interface. Ships with a zero-dependency JSON adapter and an optional SQLite adapter.

## Install

```bash
npm install zeew-eco
```

For SQLite support, also install the peer dependency:

```bash
npm install better-sqlite3
```

## Quick Start

```typescript
import { Economy, Store, Inventory, Bank, JsonAdapter } from "zeew-eco";

const adapter = new JsonAdapter("./economy-data.json");

const eco = new Economy(adapter);
const store = new Store(adapter);
const inventory = new Inventory(adapter);
const bank = new Bank(adapter);

// Give a user 1000 coins
await eco.add("user-id", "guild-id", 1000);

// Create a store item
const item = await store.add("guild-id", "VIP Role", "Exclusive VIP access", 500, "role_id");

// User buys it
const result = await eco.buy("user-id", "guild-id", item.id);
// result: { item: {...}, money: 1000, newMoney: 500 }

// Deposit to bank
await bank.deposit("user-id", "guild-id", 200);
```

## Adapters

| Adapter | Dependencies | Storage | Use case |
|---------|-------------|---------|----------|
| `JsonAdapter` | None | JSON file | Default, prototyping, small bots |
| `SqliteAdapter` | `better-sqlite3` (peer) | SQLite file | Production, larger bots |

### Custom Adapter

Implement the `Adapter` interface to use any database:

```typescript
import { Adapter, UserKey, GuildKey, MoneyRecord, StoreRecord, InventoryRecord, BankRecord } from "zeew-eco";

class MongoAdapter implements Adapter {
  async findMoney(key: UserKey): Promise<MoneyRecord | null> { /* ... */ }
  async upsertMoney(key: UserKey, money: number): Promise<void> { /* ... */ }
  async deleteMoney(key: UserKey): Promise<void> { /* ... */ }
  // ... 9 more methods
}
```

## API Reference

### Economy

| Method | Signature | Returns |
|--------|-----------|---------|
| `get` | `(user: string, guild: string)` | `Promise<number>` — current balance |
| `add` | `(user: string, guild: string, amount: number)` | `Promise<number>` — new balance |
| `remove` | `(user: string, guild: string, amount: number)` | `Promise<number>` — new balance (min 0) |
| `reset` | `(user: string, guild: string)` | `Promise<boolean>` |
| `buy` | `(user: string, guild: string, itemId: string)` | `Promise<BuyResult \| { error: string }>` |
| `work` | `(user: string, guild: string, maxEarnings: number)` | `Promise<number>` — earned amount |

**BuyResult:**
```typescript
{ item: StoreItem, money: number, newMoney: number }
```

**Buy errors:** `store_not_found`, `user_not_found`, `item_not_found`, `insufficient_funds`

### Store

| Method | Signature | Returns |
|--------|-----------|---------|
| `get` | `(guild: string)` | `Promise<StoreItem[]>` |
| `add` | `(guild: string, name: string, description: string, price: number, item?: string)` | `Promise<StoreItem>` |
| `remove` | `(guild: string, itemId: string)` | `Promise<boolean>` |
| `reset` | `(guild: string)` | `Promise<boolean>` |

**StoreItem:** `{ id, name, description, price, item }`

### Inventory

| Method | Signature | Returns |
|--------|-----------|---------|
| `get` | `(user: string, guild: string)` | `Promise<InventoryItem[]>` |
| `getItem` | `(user: string, guild: string, itemId: string)` | `Promise<InventoryItem \| null>` |
| `add` | `(user: string, guild: string, name: string, item?: string)` | `Promise<InventoryItem>` |
| `remove` | `(user: string, guild: string, itemId: string)` | `Promise<boolean>` |
| `reset` | `(user: string, guild: string)` | `Promise<boolean>` |

**InventoryItem:** `{ id, name, item }`

### Bank

| Method | Signature | Returns |
|--------|-----------|---------|
| `get` | `(user: string, guild: string)` | `Promise<number>` |
| `add` | `(user: string, guild: string, amount: number)` | `Promise<number>` |
| `remove` | `(user: string, guild: string, amount: number)` | `Promise<number>` (min 0) |
| `reset` | `(user: string, guild: string)` | `Promise<boolean>` |
| `deposit` | `(user: string, guild: string, amount: number)` | `Promise<DepositResult \| { error: string }>` |
| `withdraw` | `(user: string, guild: string, amount: number)` | `Promise<WithdrawResult \| { error: string }>` |

**DepositResult / WithdrawResult:** `{ economy: number, bank: number }`

**Deposit errors:** `economy_not_found`, `insufficient_funds`
**Withdraw errors:** `bank_not_found`, `insufficient_funds`

## Error Handling

All methods return typed results. Operations that can fail return `{ error: string }` instead of throwing:

```typescript
const result = await eco.buy(user, guild, itemId);
if ("error" in result) {
  console.log(result.error); // "insufficient_funds" | "store_not_found" | ...
} else {
  console.log(result.newMoney);
}
```

## Migration from v1.x

| v1.x | v2.0 |
|------|------|
| `new Options(mongoUri)` | `new JsonAdapter(filePath)` |
| `new Economia()` | `new Economy(adapter)` |
| `eco.ver(u, g)` | `eco.get(u, g)` |
| `eco.agregar(u, g, amt)` | `eco.add(u, g, amt)` |
| `eco.remover(u, g, amt)` | `eco.remove(u, g, amt)` |
| `eco.reiniciar(u, g)` | `eco.reset(u, g)` |
| `eco.comprar(u, g, id)` | `eco.buy(u, g, id)` |
| `eco.trabajar(u, g, max)` | `eco.work(u, g, max)` |

Same pattern for `Tienda` → `Store`, `Inventario` → `Inventory`, `Banco` → `Bank`.

## Testing

```bash
npm test              # Run all 67 tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## License

[PolyForm Noncommercial License 1.0.0](./LICENSE) — free for noncommercial use. Commercial use requires a separate license. Contact: proyects@zeew.dev

## Community

- [Discord](https://zeew.dev/discord)
- [GitHub Issues](https://github.com/zeewdev/zeew-eco/issues)
