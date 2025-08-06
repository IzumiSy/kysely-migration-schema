import { z } from "zod";

const tableSchema = z.object({
  tableName: z.string(),
  columns: z.record(
    z.string(),
    z.object({
      type: z.string(),
      primaryKey: z.boolean().optional().default(false),
      notNull: z.boolean().optional().default(false),
      unique: z.boolean().optional().default(false),
    })
  ),
});

const indexSchema = z.record(
  z.string(),
  z.object({
    table: z.string(),
    columns: z.array(z.string()),
    unique: z.boolean().optional(),
  })
);

const dialectEnum = z.enum(["postgres", "mysql", "sqlite", "mssql"]);
const databaseSchema = z.object({
  dialect: dialectEnum,
  connectionString: z.string(),
});

export const configSchema = z.object({
  database: databaseSchema,
  tables: z.array(tableSchema),
  indexes: z.array(indexSchema).optional(),
});

export const migrationSchema = z.object({
  id: z.string(),
  version: z.string(),
  diff: z.any(), // Placeholder for TableDiff type
});

export type ConfigValue = z.infer<typeof configSchema>;
export type DialectEnum = z.infer<typeof dialectEnum>;
