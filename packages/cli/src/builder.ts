import { ColumnDefinition } from "./schema";
import { ColumnDataType } from "kysely";

type ColumnOptions = Partial<Omit<ColumnDefinition, "type">>;

export const column = (type: ColumnDataType, options?: ColumnOptions) => ({
  type,
  notNull: options?.notNull,
  primaryKey: options?.primaryKey,
  unique: options?.unique,
  defaultSql: options?.defaultSql,
  checkSql: options?.checkSql,
});

export const defineTable = <
  T extends Record<
    string,
    {
      type: ColumnDataType;
    } & ColumnOptions
  >,
>(
  name: string,
  columns: T
) => {
  return {
    tableName: name,
    columns,
  };
};

export type DefinedTable = ReturnType<typeof defineTable>;
