# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-07-04

### Added

- TypeScript rewrite with full type definitions
- Database adapter pattern (Adapter interface)
- JsonAdapter — zero-dependency JSON file storage (default)
- SqliteAdapter — optional SQLite backend via `better-sqlite3` (peer dependency)
- All adapters are swappable at construction time
- Full ESM and CommonJS support via TypeScript compilation

### Changed

- Migrated from Mongoose to pluggable adapter architecture
- All class constructors now accept an `Adapter` instance
- Economy, Store, Inventory, and Bank modules refactored to adapter-based queries
- Package entry point changed from `index.js` to `dist/index.js`
- Package now ships with `.d.ts` type declarations

### Removed

- Mongoose dependency (was required, now zero runtime dependencies)
- `uuid` dependency (ID generation is now internal)
- Legacy JavaScript source files (`index.js`, `src/*.js`, `src/models/`)
- `Options` class (replaced by adapter instantiation)

### Breaking Changes

- ⚠️ **Constructor API changed**: All modules now require an `Adapter` instance instead of using global Mongoose connection
- ⚠️ **Package entry point**: Changed from `index.js` to `dist/index.js`
- ⚠️ **Named exports**: Use `{ Economy, Store, Inventory, Bank, JsonAdapter }` instead of `{ Options, Economia, Tienda, Inventario, Banco }`
- ⚠️ **Method names**: Spanish method names (`ver`, `agregar`, `remover`, `reiniciar`) replaced with English (`get`, `add`, `remove`, `reset`)
- ⚠️ **Return types**: Error cases return `{ error: string }` objects instead of `{ false }` or `undefined`

[Unreleased]: https://github.com/zeewspace/zeew-eco/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/zeewspace/zeew-eco/releases/tag/v2.0.0
