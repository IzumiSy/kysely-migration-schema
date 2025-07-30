import { z } from "zod";

const tableSchema = z.record(
  z.string(),
  z.record(
    z.string(),
    z.object({
      type: z.string(),
      primaryKey: z.boolean().optional(),
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

const optionsSchema = z.object({
  migrationDir: z.string().optional(),
});

export const configSchema = z.object({
  options: optionsSchema.optional(),
  tables: tableSchema,
  indexes: indexSchema.optional(),
});

export type ConfigType = z.infer<typeof configSchema>;
