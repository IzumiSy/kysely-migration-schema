import { Migrator } from "kysely";
import { loadConfig } from "c12";
import { ConfigType, configSchema } from "./schema";
import { diffTables, TableDef, Tables } from "./diff";
import { createMigrationProvider } from "./migration";
import { defineCommand, runMain } from "citty";
import { getIntrospector } from "./introspector";
import * as pkg from "../package.json";

const migrateCmd = defineCommand({
  meta: {
    name: "migrate",
    description: "Run migrations to sync database schema",
  },
  run: async () => {
    try {
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
        acc[table.name] = (table.columns ?? []).reduce<TableDef>(
          (cols, col) => {
            cols[col.name] = { type: col.dataType };
            return cols;
          },
          {}
        );
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

      const { results: migrationResults, error: migrationError } =
        await migrator.migrateToLatest();

      migrationResults?.forEach((result) => {
        if (result.status === "Success") {
          console.log("migration executed successfully");
        } else if (result.status === "Error") {
          console.error(`failed to execute migration: ${migrationError} `);
        }
      });

      await db.destroy();
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  },
});

const mainCmd = defineCommand({
  meta: {
    name: "kysely-schema",
    version: pkg.version,
    description: "Kysely migration CLI with declarative schema",
  },
  subCommands: {
    migrate: migrateCmd,
  },
});

runMain(mainCmd);
