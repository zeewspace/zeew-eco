# zeew-eco

> Sistema de economia standalone y agnostico a bases de datos para bots de Discord. TypeScript, cero dependencias, backends de almacenamiento intercambiables.

[![CI](https://github.com/zeewspace/zeew-eco/actions/workflows/ci.yml/badge.svg)](https://github.com/zeewspace/zeew-eco/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/zeew-eco)](https://www.npmjs.com/package/zeew-eco)
[![license](https://img.shields.io/npm/l/zeew-eco)](./LICENSE)

---

## Que es zeew-eco?

Sistema de economia completo — billetera, banco, tienda, inventario, daily rewards, badges, marketplace — para bots de Discord. **Agnotico a la base de datos**: 5 adaptadores incluidos (JSON, SQLite, Memory, MongoDB, Redis). Multi-moneda, historial de transacciones, y hooks de eventos.

## Instalacion

```bash
npm install zeew-eco
```

Para SQLite: `npm install better-sqlite3`

## Inicio Rapido

```typescript
import { Economy, Store, Inventory, Bank, JsonAdapter, Daily, Badges, Market } from "zeew-eco";

const adapter = new JsonAdapter("./data.json");
const eco = new Economy(adapter);
const store = new Store(adapter);
const inventory = new Inventory(adapter);
const bank = new Bank(adapter);
const daily = new Daily(adapter);
const badges = new Badges(adapter);
const market = new Market(adapter);

await eco.add("user-id", "guild-id", 1000);
await store.add("guild-id", "Rol VIP", "Acceso VIP", 500, "role_id", { stock: 10 });
await eco.buy("user-id", "guild-id", item.id);
const top = await eco.leaderboard("guild-id", 10);
await eco.transfer("user-a", "user-b", "guild-id", 200);
await daily.claim("user-id", "guild-id");
await badges.define("guild-id", "first-buy", "Primera Compra", "Compraste por primera vez");
await market.list("user-id", "guild-id", "Espada Rara", 500);
```

## Adaptadores

| Adaptador | Dependencias | Almacenamiento | Caso de uso |
|-----------|-------------|----------------|-------------|
| `JsonAdapter` | Ninguna | Archivo JSON | Default, prototyping |
| `SqliteAdapter` | `better-sqlite3` (peer) | Archivo SQLite | Produccion |
| `MemoryAdapter` | Ninguna | Memoria RAM | Tests, prototyping |
| `MongoAdapter` | `mongodb` (peer) | MongoDB | Bots grandes, multi-server |
| `RedisAdapter` | `ioredis` (peer) | Redis | Ultra-rapido, escalable |

### Adaptador Personalizado

Implementa la interfaz `Adapter` (30 metodos) para cualquier base de datos.

## Modulos

### Economy — Billetera

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(user, guild, currency?)` | `Promise<number>` |
| `add` | `(user, guild, amount, currency?)` | `Promise<number>` |
| `remove` | `(user, guild, amount, currency?)` | `Promise<number>` |
| `reset` | `(user, guild)` | `Promise<boolean>` |
| `buy` | `(user, guild, itemId)` | `Promise<BuyResult \| { error }>` |
| `work` | `(user, guild, max, options?)` | `Promise<WorkResult \| WorkCooldownResult>` |
| `transfer` | `(from, to, guild, amount, currency?)` | `Promise<TransferResult \| { error }>` |
| `bulkAdd` | `(items: BulkItem[])` | `Promise<number>` |
| `leaderboard` | `(guild, limit?)` | `Promise<LeaderboardEntry[]>` |
| `history` | `(user, guild, options?)` | `Promise<TransactionEntry[]>` |

### Store — Tienda

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(guild)` | `Promise<StoreItem[]>` |
| `add` | `(guild, name, desc, price, item?, options?)` | `Promise<StoreItem>` |
| `remove` | `(guild, itemId)` | `Promise<boolean>` |
| `reset` | `(guild)` | `Promise<boolean>` |
| `setStock` | `(guild, itemId, stock)` | `Promise<boolean>` |

### Inventory — Inventario

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(user, guild)` | `Promise<InventoryItem[]>` |
| `getItem` | `(user, guild, itemId)` | `Promise<InventoryItem \| null>` |
| `add` | `(user, guild, name, item?)` | `Promise<InventoryItem>` |
| `remove` | `(user, guild, itemId)` | `Promise<boolean>` |
| `reset` | `(user, guild)` | `Promise<boolean>` |

### Bank — Banco

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(user, guild)` | `Promise<number>` |
| `add` | `(user, guild, amount)` | `Promise<number>` |
| `remove` | `(user, guild, amount)` | `Promise<number>` |
| `reset` | `(user, guild)` | `Promise<boolean>` |
| `deposit` | `(user, guild, amount)` | `Promise<DepositResult \| { error }>` |
| `withdraw` | `(user, guild, amount)` | `Promise<WithdrawResult \| { error }>` |
| `leaderboard` | `(guild, limit?)` | `Promise<LeaderboardEntry[]>` |

### Daily — Recompensas Diarias

```typescript
const daily = new Daily(adapter, { baseReward: 100, streakBonus: 10 });
const result = await daily.claim("user-id", "guild-id");
// { earned: 170, streak: 7, total: 1170 }
// { error: "already_claimed", nextIn: 43200000, streak: 7 }
```

### Badges — Logros

```typescript
const badges = new Badges(adapter);
await badges.define("guild-id", "first-buy", "Primera Compra", "Compraste algo", "🛒");
await badges.award("user-id", "guild-id", "first-buy");
const has = await badges.has("user-id", "guild-id", "first-buy");
const count = await badges.count("user-id", "guild-id");
```

### Market — Marketplace

```typescript
const market = new Market(adapter, { feePercent: 5 });
const listing = await market.list("seller", "guild-id", "Espada Rara", 500, { item: "role_id" });
await market.buy("buyer", "guild-id", listing.id);
// Deducts from buyer, pays seller minus fee
```

## Multi-Moneda

```typescript
const eco = new Economy(adapter, { currencies: ["gold", "gems", "tokens"] });
await eco.add("user-id", "guild-id", 100, "gems");
await eco.add("user-id", "guild-id", 500); // default currency
const gems = await eco.get("user-id", "guild-id", "gems");
const gold = await eco.get("user-id", "guild-id", "gold");
await eco.transfer("user-a", "user-b", "guild-id", 50, "gems");
```

## Hooks (Eventos)

```typescript
const eco = new Economy(adapter, {
  hooks: {
    onBalanceChange: (user, guild, oldBal, newBal) => { /* ... */ },
    onPurchase: (user, guild, item) => { /* ... */ },
    onTransfer: (from, to, guild, amount) => { /* ... */ },
    onWork: (user, guild, earned) => { /* ... */ },
    onDaily: (user, guild, earned, streak) => { /* ... */ },
  },
});
```

## Logger

```typescript
const eco = new Economy(adapter, { logger: console });
```

## Migracion desde v1.x (MongoDB)

```typescript
import { JsonAdapter, migrateFromV1 } from "zeew-eco";
const data = { economy: require("./export.json") };
const result = await migrateFromV1(new JsonAdapter("./migrated.json"), data);
```

## Migracion de v1.x a v3.x

| v1.x | v3.x |
|------|------|
| `new Options(mongoUri)` | `new JsonAdapter(filePath)` |
| `new Economia()` | `new Economy(adapter)` |
| `eco.ver(u, g)` | `eco.get(u, g)` |
| `eco.agregar(u, g, amt)` | `eco.add(u, g, amt)` |
| `eco.comprar(u, g, id)` | `eco.buy(u, g, id)` |
| `eco.trabajar(u, g, max)` | `eco.work(u, g, max)` |

## Testing

```bash
npm test              # 136 tests
npm run test:watch    # Modo watch
```

## Licencia

[PolyForm Noncommercial License 1.0.0](./LICENSE) — uso gratuito no comercial. Uso comercial: team@zeew.space

## Comunidad

- [Discord](https://zeew.space/discord)
- [GitHub Issues](https://github.com/zeewspace/zeew-eco/issues)

---

# English

Standalone, database-agnostic economy system for Discord bots. TypeScript, zero dependencies, 5 storage backends.

**Features**: Wallet, bank, store (with stock), inventory, daily rewards (with streak), badges/achievements, marketplace, multi-currency, transaction history, event hooks, logger.

**Adapters**: JsonAdapter, SqliteAdapter, MemoryAdapter, MongoAdapter, RedisAdapter.

**Install**: `npm install zeew-eco`

See full API reference in the [Spanish section](#modulos).

[PolyForm Noncommercial License 1.0.0](./LICENSE) | [Discord](https://zeew.space/discord)
