import {
  Kysely,
  Migrator,
  PostgresDialect,
  PostgresIntrospector,
} from "kysely";
import { Pool } from "pg";
import { loadConfig } from "c12";
import { ConfigType, DialectEnum, configSchema } from "./schema";
import { diffTables, TableDef, Tables } from "./diff";
import { createMigrationProvider } from "./migration";

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

  const { introspector, db } = await getIntrospector({
    ...parsedConfig.database,
  });

  const tables = await introspector.getTables();

  // DB側のテーブル情報をTables型に変換
  const dbTables = tables.reduce<Tables>((acc, table) => {
    acc[table.name] = (table.columns ?? []).reduce<TableDef>((cols, col) => {
      cols[col.name] = { type: col.dataType };
      return cols;
    }, {});
    return acc;
  }, {});

  // 設定ファイルのテーブル定義をTables型に変換
  const configTables = Object.fromEntries(
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

  const migrationProvider = createMigrationProvider({
    db,
    diff: diffTables({
      current: dbTables,
      ideal: configTables,
    }),
  });
  const migrator = new Migrator({
    db,
    provider: migrationProvider,
  });

  const { results: migrationResults } = await migrator.migrateToLatest();

  migrationResults?.forEach((result) => {
    if (result.status === "Success") {
      console.log(
        `migration "${result.migrationName}" was executed successfully`
      );
    } else if (result.status === "Error") {
      console.error(`failed to execute migration "${result.migrationName}"`);
    }
  });

  await db.destroy();
};

type GetIntrospectorProps = {
  dialect: DialectEnum;
  connectionString: string;
};

const getIntrospector = async (props: GetIntrospectorProps) => {
  switch (props.dialect) {
    case "postgres": {
      const db = new Kysely({
        dialect: new PostgresDialect({
          pool: new Pool({
            connectionString: props.connectionString,
          }),
        }),
      });
      return { introspector: new PostgresIntrospector(db), db };
    }
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
