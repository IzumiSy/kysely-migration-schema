import { ColumnDefinition } from "./schema";
import { ColumnDataType } from "kysely";

export const column = (type: ColumnDataType, options: ColumnDefinition) => ({
  type,
  notNull: options.notNull,
  primaryKey: options.primaryKey,
  unique: options.unique,
  defaultSql: options.defaultSql,
  checkSql: options.checkSql,
});

export const defineTable = <T extends Record<string, ColumnDefinition>>(
  name: string,
  columns: T
) => {
  return {
    tableName: name,
    columns,
  };
};

export type DefinedTable = ReturnType<typeof defineTable>;
