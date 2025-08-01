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

1. Create a `kysely-schema.config.ts` file in your project root and define your schema:

```ts
export default {
  // DB connection info 
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
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

2. Run the CLI to run migrateion:

```bash
kysely-schema-migrator migrate
```

## Supported Databases

- Postgres (MySQL, SQLite, MSSQL support planned)

## License

MIT
