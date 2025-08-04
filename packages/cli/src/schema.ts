import { z } from "zod";

const tableSchema = z.record(
  z.string(),
  z.record(
    z.string(),
    z.object({
      type: z.string(),
      notNull: z.boolean().optional(),
    })
  )
);

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
  tables: tableSchema,
  indexes: indexSchema.optional(),
});

export const migrationSchema = z.object({
  id: z.string(),
  version: z.string(),
  diff: z.any(), // Placeholder for TableDiff type
});

export type ConfigValue = z.infer<typeof configSchema>;
export type DialectEnum = z.infer<typeof dialectEnum>;
