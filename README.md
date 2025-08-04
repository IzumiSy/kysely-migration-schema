# kysely-schema-migrator

## Overview

`kysely-schema-migrator` is a CLI tool that compares your defined database schema (written in a TypeScript config file) with the current state of your actual database, and executes migration from the diff if needed by using [kysely migration](https://www.kysely.dev/docs/migrations).

## Installation

```bash
pnpm install -g kysely-schema-migrator
# or
npm install -g kysely-schema-migrator
```

## Usage

1. Create a `kysely-schema.config.ts` file in your project root and define your schema (see [examples/basic](./examples/basic) for a real-world example):

```ts
export default {
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  },
  tables: {
    members: {
      id: {
        type: "uuid",
        notNull: true,
        primaryKey: true,
      },
      email: {
        type: "text",
        notNull: true,
        unique: true,
      },
      name: {
        type: "text",
        unique: true,
      },
      age: {
        type: "int4",
      },
      createdAt: {
        type: "timestamptz",
      },
    },
  },
};
```

2. Generate a migration file from the schema diff:

```bash
kysely-schema-migrator generate
```

3. Apply the generated migration(s):

```bash
kysely-schema-migrator apply
```

### Commands

- `kysely-schema-migrator generate`  
  Generate migration file(s) from schema diff  
  - `--apply` : Apply immediately after generation

- `kysely-schema-migrator apply`  
  Apply migrations to the database  
  - `--dry-run` : Output SQL only (do not execute)

## Example Project

A sample project is available in [examples/basic](./examples/basic):

- Example `kysely-schema.config.ts`
- Example `package.json` and `tsconfig.json`
- You can use this as a reference for your own setup.

## Supported Databases

- PostgreSQL  
  (MySQL, SQLite, MSSQL support planned)

## FAQ

### Q. How do I perform a dry-run to see the SQL without applying changes?

Use the `--dry-run` option with the `apply` command:

```bash
kysely-schema-migrator apply --dry-run
```

### Q. What should I do if my migration fails?

- Check your database connection settings and schema definitions.
- Make sure your database is running and accessible.
- Resolve any pending migrations before generating new ones.
- See error messages for details.

---

## Recommended Workflow

1. Edit `kysely-schema.config.ts` to update your schema.
2. Run `kysely-schema-migrator generate` to detect diffs and generate migration files.
3. Review the generated migration(s). If needed, use `--apply` to apply immediately.
4. Run `kysely-schema-migrator apply` to apply migrations.
5. Use `--dry-run` to safely preview SQL.

---

## Troubleshooting

- If migration fails, check for pending migrations and resolve them before generating new ones.
- Ensure the `migrations/` directory is under version control.
- For team development, coordinate migration generation and application to avoid conflicts.

---

## Design & Extensibility

- Declarative schema management in TypeScript.
- Diff-based migration: only necessary changes are applied.
- Modular architecture for easy extension (see `DESIGN.md`).

## License

MIT
