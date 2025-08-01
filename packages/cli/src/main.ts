import {
  DatabaseIntrospector,
  Kysely,
  PostgresDialect,
  PostgresIntrospector,
} from "kysely";
import { Pool } from "pg";
import { loadConfig } from "c12";
import { ConfigType, DialectEnum, configSchema } from "./schema.js";
import { diffTables, Tables } from "./diff.js";

const main = async () => {
  const loadedConfig = await loadConfig<ConfigType>({
    name: "kysely-schema",
  });

  const {
    data: parsedConfig,
    success: parseResult,
    error: parseError,
  } = configSchema.safeParse(loadedConfig.config);
  if (!parseResult) {
    console.error("Invalid config:", parseError);
    process.exit(1);
  }

  const introspector = await getIntrospector({
    ...parsedConfig.database,
  });

  const tables = await getTablesFromIntrospection(introspector);

  // DB側のテーブル情報をTables型に変換
  const dbTables: Tables = tables.reduce<Tables>((acc, table) => {
    acc[table.name] = (table.columns ?? []).reduce<
      Record<string, { type: string }>
    >((cols, col) => {
      cols[col.name] = { type: col.dataType };
      return cols;
    }, {});
    return acc;
  }, {});

  // 設定ファイルのテーブル定義をTables型に変換
  const configTables: Tables = Object.fromEntries(
    Object.entries(parsedConfig.tables).map(([tableName, columns]) => [
      tableName,
      Object.fromEntries(
        Object.entries(columns).map(([colName, colDef]) => [
          colName,
          { type: colDef.type },
        ])
      ),
    ])
  );

  const diff = diffTables(dbTables, configTables);
  console.log(JSON.stringify(diff, null, 2));
};

const getTablesFromIntrospection = async (
  introspector: DatabaseIntrospector
) => {
  const tables = await introspector.getTables();
  return tables;
};

type GetIntrospectorProps = {
  dialect: DialectEnum;
  connectionString: string;
};

const getIntrospector = async (props: GetIntrospectorProps) => {
  switch (props.dialect) {
    case "postgres":
      return new PostgresIntrospector(
        new Kysely({
          dialect: new PostgresDialect({
            pool: new Pool({
              connectionString: props.connectionString,
            }),
          }),
        })
      );
    default:
      throw new Error(`Unsupported dialect: ${props.dialect}`);
  }
};

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
