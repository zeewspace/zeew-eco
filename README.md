# zeew-eco

> Sistema de economia standalone y agnostico a bases de datos para bots de Discord. TypeScript, cero dependencias, backends de almacenamiento intercambiables.

[![CI](https://github.com/zeewspace/zeew-eco/actions/workflows/ci.yml/badge.svg)](https://github.com/zeewspace/zeew-eco/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/zeew-eco)](https://www.npmjs.com/package/zeew-eco)
[![license](https://img.shields.io/npm/l/zeew-eco)](./LICENSE)

---

## Que es zeew-eco?

Sistema de economia completo — billetera, banco, tienda e inventario — para bots de Discord. Es **agnostico a la base de datos**: trae tu propio backend de almacenamiento mediante la interfaz `Adapter`. Incluye un adaptador JSON sin dependencias y un adaptador SQLite opcional.

## Instalacion

```bash
npm install zeew-eco
```

Para soporte SQLite, instala tambien la dependencia peer:

```bash
npm install better-sqlite3
```

## Inicio Rapido

```typescript
import { Economy, Store, Inventory, Bank, JsonAdapter } from "zeew-eco";

const adapter = new JsonAdapter("./economy-data.json");

const eco = new Economy(adapter);
const store = new Store(adapter);
const inventory = new Inventory(adapter);
const bank = new Bank(adapter);

// Darle 1000 monedas a un usuario
await eco.add("user-id", "guild-id", 1000);

// Crear un item en la tienda
const item = await store.add("guild-id", "Rol VIP", "Acceso exclusivo VIP", 500, "role_id");

// El usuario lo compra
const result = await eco.buy("user-id", "guild-id", item.id);
// result: { item: {...}, money: 1000, newMoney: 500 }

// Depositar al banco
await bank.deposit("user-id", "guild-id", 200);

// Leaderboard
const top = await eco.leaderboard("guild-id", 10);

// Transferir entre usuarios
await eco.transfer("user-a", "user-b", "guild-id", 200);

// Trabajar con cooldown (60 segundos)
await eco.work("user-id", "guild-id", 500, { cooldown: 60_000 });
```

## Adaptadores

| Adaptador | Dependencias | Almacenamiento | Caso de uso |
|-----------|-------------|----------------|-------------|
| `JsonAdapter` | Ninguna | Archivo JSON | Default, prototyping, bots pequenos |
| `SqliteAdapter` | `better-sqlite3` (peer) | Archivo SQLite | Produccion, bots grandes |

### Adaptador Personalizado

Implementa la interfaz `Adapter` para usar cualquier base de datos:

```typescript
import { Adapter, UserKey, GuildKey, MoneyRecord, StoreRecord, InventoryRecord, BankRecord } from "zeew-eco";

class MongoAdapter implements Adapter {
  async findMoney(key: UserKey): Promise<MoneyRecord | null> { /* ... */ }
  async upsertMoney(key: UserKey, money: number): Promise<void> { /* ... */ }
  async deleteMoney(key: UserKey): Promise<void> { /* ... */ }
  // ... 9 metodos mas
}
```

## Referencia de la API

### Economy

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(user, guild)` | `Promise<number>` — saldo actual |
| `add` | `(user, guild, amount)` | `Promise<number>` — nuevo saldo |
| `remove` | `(user, guild, amount)` | `Promise<number>` — nuevo saldo (min 0) |
| `reset` | `(user, guild)` | `Promise<boolean>` |
| `buy` | `(user, guild, itemId)` | `Promise<BuyResult \| { error }>` |
| `work` | `(user, guild, max, options?)` | `Promise<WorkResult \| WorkCooldownResult>` |
| `transfer` | `(from, to, guild, amount)` | `Promise<TransferResult \| { error }>` |
| `bulkAdd` | `(items: BulkItem[])` | `Promise<number>` — cantidad procesada |
| `leaderboard` | `(guild, limit?)` | `Promise<LeaderboardEntry[]>` |

**WorkResult:** `{ earned }` | **WorkCooldownResult:** `{ error: "cooldown", retryIn }`
**TransferResult:** `{ from, to, amount }`
**Buy errors:** `store_not_found`, `user_not_found`, `item_not_found`, `insufficient_funds`
**Transfer errors:** `sender_not_found`, `insufficient_funds`

### Store

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(guild)` | `Promise<StoreItem[]>` |
| `add` | `(guild, name, description, price, item?)` | `Promise<StoreItem>` |
| `remove` | `(guild, itemId)` | `Promise<boolean>` |
| `reset` | `(guild)` | `Promise<boolean>` |

**StoreItem:** `{ id, name, description, price, item }`

### Inventory

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(user, guild)` | `Promise<InventoryItem[]>` |
| `getItem` | `(user, guild, itemId)` | `Promise<InventoryItem \| null>` |
| `add` | `(user, guild, name, item?)` | `Promise<InventoryItem>` |
| `remove` | `(user, guild, itemId)` | `Promise<boolean>` |
| `reset` | `(user, guild)` | `Promise<boolean>` |

**InventoryItem:** `{ id, name, item }`

### Bank

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(user, guild)` | `Promise<number>` |
| `add` | `(user, guild, amount)` | `Promise<number>` |
| `remove` | `(user, guild, amount)` | `Promise<number>` (min 0) |
| `reset` | `(user, guild)` | `Promise<boolean>` |
| `deposit` | `(user, guild, amount)` | `Promise<DepositResult \| { error }>` |
| `withdraw` | `(user, guild, amount)` | `Promise<WithdrawResult \| { error }>` |
| `leaderboard` | `(guild, limit?)` | `Promise<LeaderboardEntry[]>` |

**DepositResult / WithdrawResult:** `{ economy, bank }`
**Deposit errors:** `economy_not_found`, `insufficient_funds`
**Withdraw errors:** `bank_not_found`, `insufficient_funds`

## Manejo de Errores

Todos los metodos retornan resultados tipados. Las operaciones que pueden fallar retornan `{ error: string }` en vez de lanzar excepciones:

```typescript
const result = await eco.buy(user, guild, itemId);
if ("error" in result) {
  console.log(result.error); // "insufficient_funds" | "store_not_found" | ...
} else {
  console.log(result.newMoney);
}
```

## Hooks (Eventos)

Todos los modulos soportan hooks para reaccionar a cambios:

```typescript
const eco = new Economy(adapter, {
  hooks: {
    onBalanceChange: (user, guild, oldBal, newBal) => {
      console.log(`${user} balance: ${oldBal} → ${newBal}`);
    },
    onPurchase: (user, guild, item) => {
      console.log(`${user} bought ${item.name}`);
    },
    onTransfer: (from, to, guild, amount) => {
      console.log(`${from} sent ${amount} to ${to}`);
    },
    onWork: (user, guild, earned) => {
      console.log(`${user} earned ${earned}`);
    },
  },
});
```

**Hooks disponibles por modulo:**

| Modulo | Hooks |
|--------|-------|
| `Economy` | `onBalanceChange`, `onPurchase`, `onTransfer`, `onWork` |
| `Store` | `onItemAdded`, `onItemRemoved` |
| `Inventory` | `onItemAdded`, `onItemRemoved` |
| `Bank` | `onBalanceChange`, `onDeposit`, `onWithdraw` |

## Logger

Todos los modulos aceptan un logger opcional para debug:

```typescript
const eco = new Economy(adapter, { logger: console });
// [Economy] add 100 to user1@guild1 → 600
```

Cualquier objeto con `info`, `warn`, `error`, `debug` sirve (console, pino, winston, etc).

## Migracion desde v1.x (MongoDB)

Exporta tus colecciones de MongoDB como JSON y usa la funcion de migracion:

```typescript
import { JsonAdapter, migrateFromV1 } from "zeew-eco";

const data = {
  economy: require("./export-economia.json"),
  stores: require("./export-store.json"),
  inventory: require("./export-inventory.json"),
  bank: require("./export-banco.json"),
};

const adapter = new JsonAdapter("./migrated.json");
const result = await migrateFromV1(adapter, data);
// { economy: 150, stores: 3, inventory: 89, bank: 42 }
```

## Migracion de v1.x a v3.x

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

Mismo patron para `Tienda` → `Store`, `Inventario` → `Inventory`, `Banco` → `Bank`.

## Testing

```bash
npm test              # Ejecutar los 101 tests
npm run test:watch    # Modo watch
npm run test:coverage # Con coverage
```

## Licencia

[PolyForm Noncommercial License 1.0.0](./LICENSE) — uso gratuito para fines no comerciales. Uso comercial requiere licencia separada. Contacto: team@zeew.space

## Comunidad

- [Discord](https://zeew.space/discord)
- [GitHub Issues](https://github.com/zeewspace/zeew-eco/issues)

---

# English

## What is zeew-eco?

A complete economy system — wallet, bank, store, inventory — for Discord bots. **Database-agnostic**: bring your own storage backend via the `Adapter` interface. Ships with a zero-dependency JSON adapter and an optional SQLite adapter.

## Install

```bash
npm install zeew-eco

# For SQLite support:
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

await eco.add("user-id", "guild-id", 1000);
const item = await store.add("guild-id", "VIP Role", "Exclusive access", 500, "role_id");
await eco.buy("user-id", "guild-id", item.id);
await bank.deposit("user-id", "guild-id", 200);
```

## Adapters

| Adapter | Dependencies | Storage | Use case |
|---------|-------------|---------|----------|
| `JsonAdapter` | None | JSON file | Default, prototyping, small bots |
| `SqliteAdapter` | `better-sqlite3` (peer) | SQLite file | Production, larger bots |

Implement the `Adapter` interface for any database (MongoDB, PostgreSQL, Redis, etc).

## API Summary

| Module | Methods |
|--------|---------|
| `Economy` | `get`, `add`, `remove`, `reset`, `buy`, `work`, `transfer`, `bulkAdd`, `leaderboard` |
| `Store` | `get`, `add`, `remove`, `reset` |
| `Inventory` | `get`, `getItem`, `add`, `remove`, `reset` |
| `Bank` | `get`, `add`, `remove`, `reset`, `deposit`, `withdraw`, `leaderboard` |

All modules support **hooks** (events) and optional **logger**. See full API reference in the [Spanish section](#referencia-de-la-api).

## License

[PolyForm Noncommercial License 1.0.0](./LICENSE) — free for noncommercial use. Commercial use requires a separate license. Contact: team@zeew.space
