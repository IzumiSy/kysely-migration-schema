# kysely-migration-schema

## Overview

`kysely-migration-schema` is a CLI tool that compares your defined database schema (written in a TypeScript config file) with the current state of your actual database, and generates migration code (diff) for use with [kysely migration](https://www.kysely.dev/docs/migrations).

## Features

- Compare schema definition files (e.g., `kysely-schema.config.ts`) with the actual DB state
- Detect differences and automatically generate TypeScript migration code
- Supports Postgres (MySQL, SQLite, MSSQL support planned)
- Handles table, column, and index additions, deletions, and modifications

## Installation

```bash
pnpm install -g kysely-migration-schema
# or
npm install -g kysely-migration-schema
```

## Usage

1. Create a `kysely-schema.config.ts` file in your project root and define your schema:

```ts
export default {
  // DB connection info 
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  },

  // Misc options (such as output directory, optional)
  options: {
    migrationDir: "your/migration/dir"
  },

  // Table definitions
  tables: {
    users: {
      id: {
        type: "string",
        primaryKey: true,
        generated: "uuid",
      },
      name: {
        type: "varchar",
        length: 255,
        notNull: true,
      },
      email: {
        type: "varchar",
        length: 255,
        unique: true,
        notNull: true,
      },
    },
  },

  // Index definitions
  indexes: {
    users_email_idx: {
      table: "users",
      columns: ["email"],
      unique: true,
    },
  },
};
```

2. Run the CLI to generate migration code:

```bash
kysely-migration-schema
```

3. Use the generated migration code together with kysely.

## Supported Databases

- Postgres (MySQL, SQLite, MSSQL support planned)

## License

MIT
