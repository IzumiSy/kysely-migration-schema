# kyrage

## Overview

`kyrage` is a minimal schema-based declarative migration tool.

It compares your defined database schema (written in a TypeScript DSL) with the current state of your actual database, and executes migration from the diff if needed by using [kysely migration](https://www.kysely.dev/docs/migrations).

## Motivation

I have been using kysely for my app as ORM, and really like its simplicity. It also comes with migration feature, but I just don't want to write the migration code by hand.

## Installation

```bash
npm install -g kyrage
```

## Usage

1. Create a `kyrage.config.ts` file in your project root and define your schema (see [examples/basic](./examples/basic) for a real-world example):

```ts
export default {
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  },
};
```

2. Define your tables

```ts
export const tables = {
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
}
```

Give your table definitions in your configuration:

```diff
+import { tables } from "./tables";

export default {
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  },
+ tables,
};
```

3. Generate a migration file from the schema diff:

```bash
$ kyrage generate
-- create_table: members (id, email, name, age, createdAt) 
✔ Migration file generated: migrations/1754372124127.json
```

If changes are needed, `migrate` command automatically generates a new migration by comparing the local schema definition with the remote database through introspection.

4. Apply the generated migration(s):

```bash
$ kyrage apply
✔ Migration applied: 1754372124127
```

`apply` command executes all the pending migrations to the database you configured.

## Supported Databases

- PostgreSQL  
  (MySQL, SQLite, MSSQL support planned)

## FAQ

### Q. What should I do if my migration fails?

- Check your database connection settings and schema definitions.
- Make sure your database is running and accessible.
- Resolve any pending migrations before generating new ones.
- See error messages for details.

## Troubleshooting

- If migration fails, check for pending migrations and resolve them before generating new ones.
- Ensure the `migrations/` directory is under version control.
- For team development, coordinate migration generation and application to avoid conflicts.

## License

MIT
