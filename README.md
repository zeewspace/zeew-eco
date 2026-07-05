# zeew-eco

> Sistema de economia standalone y agnostico a bases de datos para bots de Discord. TypeScript, cero dependencias, backends de almacenamiento intercambiables.

[![CI](https://github.com/zeewdev/zeew-eco/actions/workflows/ci.yml/badge.svg)](https://github.com/zeewdev/zeew-eco/actions/workflows/ci.yml)
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
| `get` | `(user: string, guild: string)` | `Promise<number>` — saldo actual |
| `add` | `(user: string, guild: string, amount: number)` | `Promise<number>` — nuevo saldo |
| `remove` | `(user: string, guild: string, amount: number)` | `Promise<number>` — nuevo saldo (min 0) |
| `reset` | `(user: string, guild: string)` | `Promise<boolean>` |
| `buy` | `(user: string, guild: string, itemId: string)` | `Promise<BuyResult \| { error: string }>` |
| `work` | `(user: string, guild: string, maxEarnings: number)` | `Promise<number>` — cantidad ganada |

**BuyResult:**
```typescript
{ item: StoreItem, money: number, newMoney: number }
```

**Errores de buy:** `store_not_found`, `user_not_found`, `item_not_found`, `insufficient_funds`

### Store

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(guild: string)` | `Promise<StoreItem[]>` |
| `add` | `(guild: string, name: string, description: string, price: number, item?: string)` | `Promise<StoreItem>` |
| `remove` | `(guild: string, itemId: string)` | `Promise<boolean>` |
| `reset` | `(guild: string)` | `Promise<boolean>` |

**StoreItem:** `{ id, name, description, price, item }`

### Inventory

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(user: string, guild: string)` | `Promise<InventoryItem[]>` |
| `getItem` | `(user: string, guild: string, itemId: string)` | `Promise<InventoryItem \| null>` |
| `add` | `(user: string, guild: string, name: string, item?: string)` | `Promise<InventoryItem>` |
| `remove` | `(user: string, guild: string, itemId: string)` | `Promise<boolean>` |
| `reset` | `(user: string, guild: string)` | `Promise<boolean>` |

**InventoryItem:** `{ id, name, item }`

### Bank

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `get` | `(user: string, guild: string)` | `Promise<number>` |
| `add` | `(user: string, guild: string, amount: number)` | `Promise<number>` |
| `remove` | `(user: string, guild: string, amount: number)` | `Promise<number>` (min 0) |
| `reset` | `(user: string, guild: string)` | `Promise<boolean>` |
| `deposit` | `(user: string, guild: string, amount: number)` | `Promise<DepositResult \| { error: string }>` |
| `withdraw` | `(user: string, guild: string, amount: number)` | `Promise<WithdrawResult \| { error: string }>` |

**DepositResult / WithdrawResult:** `{ economy: number, bank: number }`

**Errores de deposit:** `economy_not_found`, `insufficient_funds`
**Errores de withdraw:** `bank_not_found`, `insufficient_funds`

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

## Migracion desde v1.x

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
npm test              # Ejecutar los 67 tests
npm run test:watch    # Modo watch
npm run test:coverage # Con coverage
```

## Licencia

[PolyForm Noncommercial License 1.0.0](./LICENSE) — uso gratuito para fines no comerciales. Uso comercial requiere licencia separada. Contacto: proyects@zeew.dev

## Comunidad

- [Discord](https://zeew.dev/discord)
- [GitHub Issues](https://github.com/zeewdev/zeew-eco/issues)

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
| `Economy` | `get`, `add`, `remove`, `reset`, `buy`, `work` |
| `Store` | `get`, `add`, `remove`, `reset` |
| `Inventory` | `get`, `getItem`, `add`, `remove`, `reset` |
| `Bank` | `get`, `add`, `remove`, `reset`, `deposit`, `withdraw` |

See the full API reference in the [Spanish section](#referencia-de-la-api) above.

## License

[PolyForm Noncommercial License 1.0.0](./LICENSE) — free for noncommercial use. Commercial use requires a separate license. Contact: proyects@zeew.dev
