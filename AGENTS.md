# zeew-eco

Sistema de economia standalone y agnostico a bases de datos para bots de Discord. TypeScript, czero dependencias, backends intercambiables.

## Estructura del Proyecto

```
src/
  adapters/
    adapter.ts      — Interfaz Adapter (contrato para backends de almacenamiento)
    json.ts         — JsonAdapter: almacenamiento JSON sin dependencias (default)
    sqlite.ts       — SqliteAdapter: opcional, requiere better-sqlite3 peer dep
  economy.ts        — Clase Economy: CRUD, comprar, trabajar, transferir, leaderboard
  store.ts          — Clase Store: catalogo de items por guild
  inventory.ts      — Clase Inventory: items comprados por user+guild
  bank.ts           — Clase Bank: saldo bancario, depositar, retirar, leaderboard
  migrate.ts        — Migracion de datos v1 (MongoDB) a v3 adapter
  index.ts          — API publica (solo named exports)
  types.ts          — Interfaces TypeScript para todas las estructuras de datos
tests/
  mock-adapter.ts   — Adaptador en memoria para tests unitarios
  unit/             — Tests unitarios por modulo (MockAdapter)
  e2e/              — Tests E2E (JsonAdapter con file I/O real)
```

## Conceptos Clave

- **Patron Adapter**: Todo el almacenamiento pasa por la interfaz `Adapter` (15 metodos). Los modulos nunca tocan archivos ni bases de datos directamente.
- **Todos los metodos son async**: Cada operacion retorna una Promise.
- **Manejo de errores**: Las operaciones que pueden fallar retornan objetos `{ error: string }`, nunca lanzan excepciones.
- **Ambito User+Guild**: Los registros de dinero, inventario y banco estan delimitados por el par `(user, guild)`. Los registros de tienda estan delimitados solo por `guild`.
- **Hooks**: Todos los modulos soportan eventos via `options.hooks`.
- **Logger**: Opcional, todos los modulos aceptan `options.logger`.
- **Cooldown**: `work()` soporta rate limiting via `{ cooldown: ms }`.

## Comandos

```bash
npm test              # Ejecutar los 101 tests (vitest)
npm run test:watch    # Modo watch
npm run build         # Compilar TypeScript a dist/
npm run prepublishOnly # Ejecuta build automaticamente antes de npm publish
```

## Tech Stack

- TypeScript 5.7+ (modo estricto)
- Vitest para testing
- Node 20+ requerido
- Cero dependencias runtime (better-sqlite3 es peer dep opcional)
- Licencia: PolyForm Noncommercial 1.0.0

## Convenciones

- Solo named exports (sin default exports)
- Conventional commits: `type(scope): subject`
- Sin atribucion de IA en commits, tags o releases
- Todos los tests deben pasar antes de commitear (`npm test`)
- Type check con `npx tsc --noEmit`

---

# English

## Project Structure

```
src/
  adapters/
    adapter.ts      — Adapter interface (contract for storage backends)
    json.ts         — JsonAdapter: zero-dep JSON file storage (default)
    sqlite.ts       — SqliteAdapter: optional, requires better-sqlite3 peer dep
  economy.ts        — Economy class: wallet CRUD, buy, work, transfer, leaderboard
  store.ts          — Store class: item catalog per guild
  inventory.ts      — Inventory class: purchased items per user+guild
  bank.ts           — Bank class: bank balance, deposit, withdraw, leaderboard
  migrate.ts        — Migration utility from v1 (MongoDB) to v3 adapters
  index.ts          — Public API (named exports only)
  types.ts          — TypeScript interfaces for all data structures
tests/
  mock-adapter.ts   — In-memory adapter for unit tests
  unit/             — Unit tests per module (MockAdapter)
  e2e/              — E2E tests (JsonAdapter with real file I/O)
```

## Key Concepts

- **Adapter pattern**: All storage goes through the `Adapter` interface (15 methods). Modules never touch files or databases directly.
- **All methods are async**: Every operation returns a Promise.
- **Error handling**: Operations that can fail return `{ error: string }` objects, never throw.
- **User+Guild scoping**: Money, inventory, and bank records are scoped by `(user, guild)` pair. Store records are scoped by `guild` only.
- **Hooks**: All modules support events via `options.hooks`.
- **Logger**: Optional, all modules accept `options.logger`.
- **Cooldown**: `work()` supports rate limiting via `{ cooldown: ms }`.

## Commands

```bash
npm test              # Run all 101 tests (vitest)
npm run test:watch    # Watch mode
npm run build         # Compile TypeScript to dist/
npm run prepublishOnly # Runs build automatically before npm publish
```

## Tech Stack

- TypeScript 5.7+ (strict mode)
- Vitest for testing
- Node 20+ required
- Zero runtime dependencies (better-sqlite3 is optional peer dep)
- License: PolyForm Noncommercial 1.0.0

## Conventions

- Named exports only (no default exports)
- Conventional commits: `type(scope): subject`
- No AI attribution in commits, tags, or releases
- All tests must pass before commit (`npm test`)
- Type check with `npx tsc --noEmit`
