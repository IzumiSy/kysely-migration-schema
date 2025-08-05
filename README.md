# kyrage

[![Test](https://github.com/izumisy/kyrage/actions/workflows/test.yaml/badge.svg?branch=main)](https://github.com/izumisy/kyrage/actions/workflows/test.yaml)
[![NPM Version](https://img.shields.io/npm/v/%40izumisy%2Fkyrage)](https://www.npmjs.com/package/@izumisy/kyrage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.x-brightgreen.svg)](https://nodejs.org/)

> A minimal, schema-based declarative migration tool for Node.js ecosystem 

**kyrage** automatically generates and applies database migrations by comparing your TypeScript schema definitions with your actual database state. No more writing migration files by hand!

## Why kyrage?

Traditional database migrations require manually writing up/down migration files every time you change your schema. This is error-prone and time-consuming.

**kyrage** takes a different approach:
1. ✍️ Define your desired schema in TypeScript
2. 🔍 kyrage compares it with your actual database
3. 🚀 Automatically generates the necessary migrations
4. ✅ Apply migrations with a single command

The internal migration mechanism fully depends on [kysely migration](https://www.kysely.dev/docs/migrations).

## 📦 Installation

```bash
# Install globally
npm install -g @izumisy/kyrage

# Or use with npx
npx @izumisy/kyrage --help
```

## 🚀 Quick Start

### 1. Create Configuration File

Create a `kyrage.config.ts` file in your project root:

```typescript
export default {
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:password@localhost:5432/mydb",
  },
};
```

### 2. Define Your Schema

Create your table definitions (e.g., in `schema.ts`):

```typescript
export const tables = {
  users: {
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
      notNull: true,
    },
    age: {
      type: "int4",
    },
    createdAt: {
      type: "timestamptz",
      notNull: true,
    },
  },
  posts: {
    id: {
      type: "uuid", 
      notNull: true,
      primaryKey: true,
    },
    title: {
      type: "text",
      notNull: true,
    },
    content: {
      type: "text",
    },
  },
};
```

Add your schema to the configuration:

```diff
+import { tables } from "./schema";

export default {
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:password@localhost:5432/mydb",
  },
+ tables,
};
```

### 3. Generate Migration

Compare your schema with the database and generate a migration:

```bash
$ kyrage generate
-- create_table: users (id, email, name, age, createdAt) 
-- create_table: posts (id, title, content)
✔ Migration file generated: migrations/1754372124127.json
```

### 4. Apply Migration

Execute the generated migrations:

```bash
$ kyrage apply
✔ Migration applied: 1754372124127
```

## 📚 API Reference

### Commands

| Command | Description |
|---------|-------------|
| `kyrage generate` | Compare schema with database and generate migration file |
| `kyrage apply` | Apply all pending migrations to the database |

### Configuration

Your `kyrage.config.ts` file supports the following options:

```typescript
export default {
  database: {
    dialect: "postgres",           // Database dialect
    connectionString: string,      // Database connection string
  },
  tables: {                        // Your table definitions
    [tableName]: {
      [columnName]: {
        type: string,              // Column type (uuid, text, int4, etc.)
        notNull?: boolean,         // NOT NULL constraint
        primaryKey?: boolean,      // PRIMARY KEY constraint
        unique?: boolean,          // UNIQUE constraint  
      }
    }
  }
}
```

## 🗄️ Supported Databases

| Database | Status | Notes |
|----------|--------|-------|
| PostgreSQL | ✅ Supported | Full support with all features |
| MySQL | 🚧 Planned | Coming soon |
| SQLite | 🚧 Planned | Coming soon |
| MSSQL | 🚧 Planned | Coming soon |

## 🏗️ Examples

Check out the [examples/basic](./examples/basic) directory for a complete working example with:
- Configuration setup
- Schema definitions
- Generated migrations
- Applied database changes

## 💡 Best Practices

### Schema Management
- **Version Control**: Always commit your `kyrage.config.ts` and schema files
- **Migration Files**: Keep generated migration files in version control
- **Team Coordination**: Coordinate with your team when generating new migrations

### Development Workflow
1. Update your schema definitions in TypeScript
2. Run `kyrage generate` to create migration files
3. Review the generated migrations before applying
4. Run `kyrage apply` to update your database
5. Commit both schema changes and migration files

### Production Deployments
- Test migrations thoroughly in staging environments
- Run migrations as part of your deployment pipeline
- Always backup your database before running migrations in production

## 🔧 Troubleshooting

### Common Issues

**Migration Generation Fails**
- Verify database connection string and credentials
- Ensure database server is running and accessible
- Check that your schema definitions are valid TypeScript

**Migration Application Fails**
- Review the generated migration file for correctness
- Ensure no conflicting migrations exist
- Check database permissions for DDL operations

**Schema Conflicts**
- Resolve any pending migrations before generating new ones
- Coordinate with team members to avoid concurrent schema changes
- Use database transactions where possible

### Getting Help

- Check the [examples](./examples/) directory for reference implementations
- Review error messages carefully - they often contain helpful details
- Ensure your `migrations/` directory exists and is writable

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
