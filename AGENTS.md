# zeew-eco

Standalone, database-agnostic economy system for Discord bots. TypeScript, zero runtime dependencies, pluggable storage backends.

## Project Structure

```
src/
  adapters/
    adapter.ts      — Adapter interface (contract for storage backends)
    json.ts         — JsonAdapter: zero-dep JSON file storage (default)
    sqlite.ts       — SqliteAdapter: optional, requires better-sqlite3 peer dep
  economy.ts        — Economy class: wallet CRUD, buy, work
  store.ts          — Store class: item catalog per guild
  inventory.ts      — Inventory class: purchased items per user+guild
  bank.ts           — Bank class: bank balance, deposit, withdraw
  index.ts          — Public API (named exports only)
  types.ts          — TypeScript interfaces for all data structures
tests/
  mock-adapter.ts   — In-memory adapter for unit tests
  unit/             — Unit tests per module (MockAdapter)
  e2e/              — E2E tests (JsonAdapter with real file I/O)
```

## Key Concepts

- **Adapter pattern**: All storage goes through the `Adapter` interface (12 methods). Modules never touch files or databases directly.
- **All methods are async**: Every operation returns a Promise.
- **Error handling**: Operations that can fail return `{ error: string }` objects, never throw.
- **User+Guild scoping**: Money, inventory, and bank records are scoped by `(user, guild)` pair. Store records are scoped by `guild` only.

## Commands

```bash
npm test              # Run all 67 tests (vitest)
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
