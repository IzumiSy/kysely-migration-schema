import { ColumnDataType } from "kysely";

type ColumnOptions = {
  primaryKey?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: unknown;
};

export type ColumnDefinition = {
  type: ColumnDataType;
  notNull: boolean;
  primaryKey: boolean;
  unique: boolean;
  default?: unknown;
};

export const column = (
  type: ColumnDataType,
  options: ColumnOptions = {}
): ColumnDefinition => ({
  type,
  notNull: !options.nullable,
  primaryKey: !!options.primaryKey,
  unique: !!options.unique,
  default: options.default,
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
