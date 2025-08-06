# kyrage

[![Test](https://github.com/izumisy/kyrage/actions/workflows/test.yaml/badge.svg?branch=main)](https://github.com/izumisy/kyrage/actions/workflows/test.yaml)
[![NPM Version](https://img.shields.io/npm/v/%40izumisy%2Fkyrage)](https://www.npmjs.com/package/@izumisy/kyrage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.x-brightgreen.svg)](https://nodejs.org/)

> A minimal, schema-based declarative migration tool for Node.js ecosystem 

**kyrage (kirāju)** automatically generates and applies database migrations by comparing your TypeScript schema definitions with your actual database state. No more writing migration files by hand!

## Why kyrage?

Traditional database migrations require manually writing up/down migration files every time you change your schema. This is error-prone and time-consuming.

**kyrage** takes a different approach:
1. ✍️ Define your desired schema in TypeScript
2. 🔍 kyrage compares it with your actual database
3. 🚀 Automatically generates the necessary migrations
4. ✅ Apply migrations with a single command

This is a style of managing database schema that is called as [Versioned Migration Authoring](https://atlasgo.io/blog/2022/08/11/announcing-versioned-migration-authoring) by Atlas. 

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
import { defineConfig } from "@izumisy/kyrage";

export default defineConfig({
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:password@localhost:5432/mydb",
  },
});
```

### 2. Define Your Schema

Create your table definitions (e.g., in `schema.ts`):

```typescript
import { column as c, defineTable as t } from "@izumisy/kyrage";

export const members = t("members", {
  id: c("uuid", { primaryKey: true }),
  email: c("text", { unique: true }),
  name: c("text", { unique: true }),
  age: c("integer", { nullable: true }),
  createdAt: c("timestamptz"),
});

export const posts = t("posts", {
  id: c("uuid", { primaryKey: true }),
  author_id: c("uuid"),
  title: c("text"),
  content: c("text"),
  published: c("boolean", { default: false }),
  published_at: c("timestamptz", { nullable: true }),
});
```

Add your schema to the configuration:

```diff
import { defineConfig } from "@izumisy/kyrage";
+import { members, posts } from "./schema";

export default defineConfig({
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:password@localhost:5432/mydb",
  },
+ tables: [members, posts],
});
```

### 3. Generate Migration

Compare your schema with the database and generate a migration:

```bash
$ kyrage generate
-- create_table: members (id, email, name, age, createdAt) 
-- create_table: posts (id, author_id, title, content, published, published_at)
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
import { column as c, defineTable as t } from "@izumisy/kyrage";

export default {
  database: {
    dialect: "postgres",           // Database dialect
    connectionString: string,      // Database connection string
  },
  tables: [                        // Array of table definitions
    t("tableName", {               // Use defineTable function
      columnName: c("type", {      // Use column function
        primaryKey?: boolean,      // PRIMARY KEY constraint
        unique?: boolean,          // UNIQUE constraint
        nullable?: boolean,        // Allow NULL values
        default?: any,             // Default value
      })
    }),
    // ... more tables
  ]
}
```

## 🗄️ Supported Databases

* PostgreSQL
* MySQL
* SQLite
* CockroachDB

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
