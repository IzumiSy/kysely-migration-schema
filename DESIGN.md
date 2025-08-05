# DESIGN.md

## Overview

This document describes the internal design and architecture of `kyrage`. It is intended for contributors and maintainers.

---

## Package Structure

- `packages/cli/`  
  Main CLI implementation and entry point.

- `packages/cli/src/`  
  - `main.ts`: CLI entry point, command definitions, and execution flow.
  - `diff.ts`: Calculates the difference between the current database schema and the desired schema.
  - `introspector.ts`: Introspects the current database schema.
  - `migration.ts`: Builds and applies migrations based on schema diffs.
  - `schema.ts`: Schema validation and config typing.
  - `tests/`: Unit tests for core logic (e.g., diff calculation).

- `examples/basic/`  
  Example project and configuration.

---

## Main Flow

1. **Configuration Loading**  
   Loads and validates `kyrage.config.ts` using Zod schema.

2. **Database Introspection**  
   Connects to the target database and introspects the current schema.

3. **Diff Calculation**  
   Uses `diffTables` to compute the difference between the current and desired schema.

4. **Migration Planning & Execution**  
   - Generates migration files as JSON in the `migrations/` directory.
   - `generate` command creates migration files from schema diff.
   - `apply` command applies migrations to the database.
   - `--dry-run` option for `apply` outputs SQL without executing.

5. **CLI Output**  
   - Logs migration results and errors.

---

## Key Modules

### `diffTables` (diff.ts)
- Compares the introspected schema and the config schema.
- Returns a diff object describing required changes (create, alter, drop, etc.).

### `buildMigrationFromDiff` (migration.ts)
- Generates migration steps (SQL) from the diff object.

### `introspector.ts`
- Connects to the database and retrieves schema metadata (tables, columns, indexes).

---

## Design Considerations

- **Declarative Schema**: Users define the desired schema in TypeScript, enabling type safety and flexibility.
- **Diff-based Migration**: Only the necessary changes are applied, minimizing risk and manual intervention.
- **Dry-run Support**: The `--dry-run` option for `apply` allows users to preview SQL before execution.
- **Extensibility**: The architecture is modular, making it easy to add support for new databases and features.

---

## Future Work

- Support for MySQL, SQLite, MSSQL.
- More advanced diffing (constraints, triggers, etc.).
- Improved error handling and reporting.
- Richer config validation and editor integration.
