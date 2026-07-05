# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.1] - 2026-07-05

### Fixed

- Include README.md and LICENSE in npm package files

## [3.1.0] - 2026-07-05

### Added

- `Economy.leaderboard(guild, limit)` — top users ranked by wallet balance
- `Bank.leaderboard(guild, limit)` — top users ranked by bank balance
- `Economy.transfer(from, to, guild, amount)` — atomic user-to-user transfers
- `Economy.bulkAdd(items)` — add money to multiple users in one call
- `Economy.work()` cooldown support — pass `{ cooldown: ms }` to rate-limit
- Event hooks: `onBalanceChange`, `onPurchase`, `onTransfer`, `onWork`, `onDeposit`, `onWithdraw`, `onItemAdded`, `onItemRemoved`
- Optional `logger` support on all modules (info/warn/error/debug)
- `migrateFromV1(adapter, data)` — migrate MongoDB (v1.x) exports to any v3 adapter
- 101 tests (up from 67)

### Changed

- `work()` now returns `{ earned }` (WorkResult) or `{ error: "cooldown", retryIn }` instead of plain number
- Adapter interface expanded: `allMoney(guild)`, `allBank(guild)`, `getCooldown()`, `setCooldown()`
- All modules accept optional `options` parameter for hooks and logger

## [3.0.0] - 2026-07-05

### Added

- TypeScript rewrite with full type definitions
- Database adapter pattern (Adapter interface)
- JsonAdapter — zero-dependency JSON file storage (default)
- SqliteAdapter — optional SQLite backend via `better-sqlite3` (peer dependency)
- All adapters are swappable at construction time
- Unit tests (59 tests) and E2E tests with vitest
- GitHub Actions CI (Node 20, 22)
- Bilingual documentation (Spanish + English)
- AGENTS.md for LLM context

### Changed

- ⚠️ **BREAKING**: Migrated from Mongoose to pluggable adapter architecture
- ⚠️ **BREAKING**: All class constructors now require an `Adapter` instance
- ⚠️ **BREAKING**: Named exports — use `{ Economy, Store, Inventory, Bank, JsonAdapter }`
- ⚠️ **BREAKING**: Method names in English (`get`, `add`, `remove`, `reset`, `buy`, `work`)
- ⚠️ **BREAKING**: Error cases return `{ error: string }` instead of `false`/`undefined`
- ⚠️ **BREAKING**: Package entry point is `dist/index.js` with `.d.ts` types
- Package renamed on npm from `2.3.3` (Mongoose) to `3.0.0` (standalone)
- License changed to PolyForm Noncommercial 1.0.0
- Node.js >= 20 required

### Removed

- Mongoose dependency (zero runtime dependencies now)
- `uuid` dependency (internal ID generation)
- Legacy JavaScript source files
- `Options` class (replaced by adapter instantiation)

[Unreleased]: https://github.com/zeewspace/zeew-eco/compare/v3.1.1...HEAD
[3.1.1]: https://github.com/zeewspace/zeew-eco/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/zeewspace/zeew-eco/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/zeewspace/zeew-eco/releases/tag/v3.0.0
