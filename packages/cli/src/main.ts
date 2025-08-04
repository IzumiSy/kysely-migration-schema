import { Kysely, Migrator } from "kysely";
import { diffTables, TableDef, TableDiff, Tables } from "./diff";
import { createMigrationProvider, migrationDirName } from "./migration";
import { defineCommand, runMain } from "citty";
import { getConnection } from "./introspector";
import * as pkg from "../package.json";
import { createConsola } from "consola";
import { loadConfigFile } from "./config";
import { ConfigValue } from "./schema";
import { writeFile, mkdir } from "fs/promises";

const logger = createConsola({
  // Redirect console output to stderr that helps users to redirect planned SQL queries to a file
  stdout: process.stderr,
});

const generateCmd = defineCommand({
  meta: {
    name: "generate",
    description: "Generate migration files based on the current schema",
  },
  run: async () => {
    try {
      const loadedConfig = await loadConfigFile();
      const { db } = await getConnection({
        database: loadedConfig.database,
      });

      const diff = await getDiffFromIntrospection({
        db,
        config: loadedConfig,
      });

      printPrettyDiff(diff);

      const migrationID = Date.now();
      const migrationJSONValue = JSON.stringify(
        {
          version: 1,
          id: migrationID,
          diff,
        },
        null,
        2
      );

      const migrationFilePath = `${migrationDirName}/migration-${migrationID}.json`;
      await mkdir(migrationDirName, { recursive: true });
      await writeFile(migrationFilePath, migrationJSONValue);

      logger.success(`Migration file generated: ${migrationFilePath}`);

      await db.destroy();
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  },
});

const applyCmd = defineCommand({
  meta: {
    name: "apply",
    description: "Run migrations to sync database schema",
  },
  run: async () => {
    try {
      const loadedConfig = await loadConfigFile();
      const { db } = await getConnection({
        database: loadedConfig.database,
      });

      const migrator = new Migrator({
        db,
        provider: createMigrationProvider({
          db,
          migrationDirName,
        }),
      });

      const { results: migrationResults, error: migrationError } =
        await migrator.migrateToLatest();

      if (migrationResults && migrationResults.length > 0) {
        migrationResults.forEach((result) => {
          if (result.status === "Error") {
            logger.error(`Migration failed: ${result.migrationName}`);
          } else if (result.status === "Success") {
            logger.success(`Migration applied: ${result.migrationName}`);
          }
        });
      } else {
        logger.info("No migrations to run");
      }

      if (migrationError) {
        logger.error(`Migration error: ${migrationError}`);
        process.exit(1);
      }

      await db.destroy();
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
      logger.info(
        `create_table: ${table.table} (${Object.keys(table.columns).join(", ")})`
      );
    });
  }
  if (diff.removedTables.length > 0) {
    diff.removedTables.forEach((table) => {
      logger.info(`remove_table: ${table}`);
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

const getDiffFromIntrospection = async (props: {
  db: Kysely<unknown>;
  config: ConfigValue;
}) => {
  const { db, config } = props;
  const tables = await db.introspection.getTables();
  const dbTables = tables.reduce<Tables>((acc, table) => {
    acc[table.name] = (table.columns ?? []).reduce<TableDef>((cols, col) => {
      cols[col.name] = { type: col.dataType };
      return cols;
    }, {});
    return acc;
  }, {});
  const configTables = Object.fromEntries(
    Object.entries(config.tables).map(([tableName, columns]) => [
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

  return diff;
};

const mainCmd = defineCommand({
  meta: {
    name: "kysely-schema",
    version: pkg.version,
    description: "Kysely migration CLI with declarative schema",
  },
  subCommands: {
    apply: applyCmd,
    generate: generateCmd,
  },
});

runMain(mainCmd);
