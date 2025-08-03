import { Migrator } from "kysely";
import { loadConfig } from "c12";
import { ConfigType, configSchema } from "./schema";
import { diffTables, TableDef, TableDiff, Tables } from "./diff";
import { createMigrationProvider } from "./migration";
import { defineCommand, runMain } from "citty";
import { getConnection } from "./introspector";
import * as pkg from "../package.json";
import { createConsola } from "consola";

const logger = createConsola({
  // Redirect console output to stderr that helps users to redirect planned SQL queries to a file
  stdout: process.stderr,
});

const migrateCmd = defineCommand({
  meta: {
    name: "migrate",
    description: "Run migrations to sync database schema",
  },
  args: {
    plan: {
      alias: ["p"],
      type: "boolean",
      default: false,
      description:
        "Show the SQL queries that would be executed without running them",
    },
  },
  run: async (ctx) => {
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
        logger.error(parseError);
        process.exit(1);
      }

      const { db } = await getConnection({
        database: parsedConfig.database,
      });

      const tables = await db.introspection.getTables();
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

      const diff = diffTables({
        current: dbTables,
        ideal: configTables,
      });

      printPrettyDiff(diff);
      if (ctx.args.plan) {
        await db.destroy();
        return;
      }

      const migrator = new Migrator({
        db,
        provider: createMigrationProvider({
          db,
          diff,
        }),
      });

      const { results: migrationResults, error: migrationError } =
        await migrator.migrateToLatest();

      if (migrationResults && migrationResults.length > 0) {
        migrationResults.forEach((result) => {
          if (result.status === "Success") {
            logger.success("Migration executed successfully");
          } else if (result.status === "Error") {
            logger.error(`Failed to execute migration: ${migrationError} `);
          }
        });
      } else {
        logger.info("No migrations to run");
      }

      EXIT: await db.destroy();
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  },
});

const printPrettyDiff = (diff: TableDiff) => {
  // Show changes one by one like (added_table, changed_column, etc.)
  if (diff.addedTables.length > 0) {
    diff.addedTables.forEach((table) => {
      logger.info(`create_table: ${table}`);
    });
  }
  if (diff.removedTables.length > 0) {
    diff.removedTables.forEach((table) => {
      logger.info(`remov_table: ${table}`);
    });
  }
  if (diff.changedTables.length > 0) {
    diff.changedTables.forEach((table) => {
      table.addedColumns.forEach((col) => {
        logger.info(
          `add_column: ${table.table}.${col.column} (${col.definition.type})`
        );
      });
      table.removedColumns.forEach((col) => {
        logger.info(
          `remove_column: ${table.table}.${col.column} (${col.definition.type})`
        );
      });
      table.changedColumns.forEach((col) => {
        logger.info(
          `change_column: ${table.table}.${col.column} (from ${col.before.type} to ${col.after.type})`
        );
      });
    });
  }
};

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
