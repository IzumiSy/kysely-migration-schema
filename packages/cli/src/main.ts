import { Kysely, Migrator } from "kysely";
import { diffTables, TableColumnAttributes, TableDiff, Tables } from "./diff";
import {
  createMigrationProvider,
  migrationDirName,
  readMigrationFiles,
} from "./migration";
import { defineCommand, runMain } from "citty";
import { getClient, GetClientProps } from "./client";
import * as pkg from "../package.json";
import { createConsola } from "consola";
import { loadConfigFile } from "./config";
import { ConfigValue } from "./schema";
import { writeFile, mkdir } from "fs/promises";

const logger = createConsola({
  // Redirect console output to stderr that helps users to redirect planned SQL queries to a file
  stdout: process.stderr,
});

const getPendingMigrations = async (db: Kysely<any>) => {
  const executedMigrations = await db
    .selectFrom("kysely_migration")
    .select(["name", "timestamp"])
    .$narrowType<{ name: string; timestamp: string }>()
    .execute()
    .catch(() => {
      return [];
    });

  if (executedMigrations.length === 0) {
    return [];
  }

  const migrationFiles = await readMigrationFiles();
  const pendingMigrations = migrationFiles.filter(
    (file) => !executedMigrations.some((m) => m.name === file.id)
  );

  return pendingMigrations;
};

const generateCmd = defineCommand({
  meta: {
    name: "generate",
    description: "Generate migration files based on the current schema",
  },
  args: {
    apply: {
      type: "boolean",
      description: "Apply the migration after generating it",
      default: false,
    },
    plan: {
      type: "boolean",
      description: "Plan the migration without applying it (only for --apply)",
      default: false,
    },
    "ignore-pending": {
      type: "boolean",
      description: "Ignore pending migrations and generate a new one",
      default: false,
    },
  },
  run: async (ctx) => {
    try {
      const loadedConfig = await loadConfigFile();
      await using client = await getClient({
        database: loadedConfig.database,
      });
      const db = client.getDB();

      if (!ctx.args["ignore-pending"]) {
        const pm = await getPendingMigrations(db);
        if (pm.length > 0) {
          logger.warn(
            [
              `There are pending migrations: ${pm.map((m) => m.id).join(", ")}`,
              "Please apply them first before generating a new migration.",
              "Otherwise, use --ignore-pending to skip this check.",
            ].join("\n")
          );
          return;
        }
      }

      const newMigration = await generateMigrationFromIntrospection({
        db,
        config: loadedConfig,
      });

      if (!newMigration) {
        logger.info("No changes detected, no migration needed.");
        return;
      }

      printPrettyDiff(newMigration.diff);

      const migrationFilePath = `${migrationDirName}/${newMigration.id}.json`;
      await mkdir(migrationDirName, { recursive: true });
      await writeFile(migrationFilePath, JSON.stringify(newMigration, null, 2));

      logger.success(`Migration file generated: ${migrationFilePath}`);

      if (ctx.args.apply) {
        await runApply({
          clientProps: {
            database: loadedConfig.database,
            options: { plan: ctx.args.plan },
          },
        });
      }
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
  args: {
    plan: {
      name: "plan",
      type: "boolean",
      description: "Plan the migration without applying it",
      default: false,
    },
  },
  run: async (ctx) => {
    try {
      const loadedConfig = await loadConfigFile();

      await runApply({
        clientProps: {
          database: loadedConfig.database,
          options: {
            plan: ctx.args.plan,
          },
        },
      });
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  },
});

const runApply = async (props: { clientProps: GetClientProps }) => {
  await using client = await getClient(props.clientProps);
  const db = client.getDB();
  const migrator = new Migrator({
    db,
    provider: createMigrationProvider({
      db,
      migrationDirName,
    }),
  });

  const { results: migrationResults, error: migrationError } =
    await migrator.migrateToLatest();

  if (props.clientProps.options?.plan) {
    client.getPlannedQueries().forEach((query) => {
      console.log(query.sql);
    });
    return;
  }

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
};

const printPrettyDiff = (diff: TableDiff) => {
  // Show changes one by one like (added_table, changed_column, etc.)
  if (diff.addedTables.length > 0) {
    diff.addedTables.forEach((table) => {
      logger.log(`-- create_table: ${table.table}`);
      Object.entries(table.columns).forEach(([colName, colDef]) => {
        logger.log(`   -> column: ${colName} (${JSON.stringify(colDef)})`);
      });
    });
  }
  if (diff.removedTables.length > 0) {
    diff.removedTables.forEach((table) => {
      logger.log(`-- remove_table: ${table}`);
    });
  }
  if (diff.changedTables.length > 0) {
    diff.changedTables.forEach((table) => {
      table.addedColumns.forEach((col) => {
        logger.log(
          [
            `-- add_column: ${table.table}.${col.column}`,
            `   -> to: ${JSON.stringify(col.attributes)}`,
          ].join("\n")
        );
      });
      table.removedColumns.forEach((col) => {
        logger.log(`-- remove_column: ${table.table}.${col.column})`);
      });
      table.changedColumns.forEach((col) => {
        logger.log(
          [
            `-- change_column: ${table.table}.${col.column}`,
            `   -> from: ${JSON.stringify(col.before)}`,
            `   -> to:   ${JSON.stringify(col.after)}`,
          ].join("\n")
        );
      });
    });
  }
};

const generateMigrationFromIntrospection = async (props: {
  db: Kysely<unknown>;
  config: ConfigValue;
}) => {
  const { db, config } = props;
  const tables = await db.introspection.getTables();
  const dbTables: Tables = tables.map((table) => ({
    name: table.name,
    columns: (table.columns ?? []).reduce(
      (cols, col) => {
        cols[col.name] = {
          type: col.dataType,
          notNull: !col.isNullable,
        };
        return cols;
      },
      {} as Record<string, TableColumnAttributes>
    ),
  }));

  const configTables: Tables = config.tables.map((table) => ({
    name: table.tableName,
    columns: Object.fromEntries(
      Object.entries(table.columns).map(([colName, colDef]) => [
        colName,
        {
          type: colDef.type,
          notNull: colDef.notNull,
          primaryKey: colDef.primaryKey,
          unique: colDef.unique,
        },
      ])
    ),
  }));

  const diff = diffTables({
    current: dbTables,
    ideal: configTables,
  });

  if (
    diff.addedTables.length === 0 &&
    diff.removedTables.length === 0 &&
    diff.changedTables.length === 0
  ) {
    return null;
  }

  const migrationID = Date.now();
  return {
    version: "1",
    id: migrationID + "",
    diff,
  };
};

const mainCmd = defineCommand({
  meta: {
    name: "kyrage",
    version: pkg.version,
    description: "Kysely migration CLI with declarative schema",
  },
  subCommands: {
    apply: applyCmd,
    generate: generateCmd,
  },
});

runMain(mainCmd);
