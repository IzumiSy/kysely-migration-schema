import { Migrator } from "kysely";
import { DBClient } from "../client";
import { createMigrationProvider, migrationDirName } from "../migration";
import { logger } from "../logger";

export const runApply = async (props: {
  client: DBClient;
  options: {
    plan: boolean;
  };
}) => {
  await props.client.switch({
    plan: props.options.plan,
  });
  const db = props.client.getDB();
  const migrator = new Migrator({
    db,
    provider: createMigrationProvider({
      db,
      migrationDirName,
    }),
  });

  const { results: migrationResults, error: migrationError } =
    await migrator.migrateToLatest();

  const plannedQueries = props.client.getPlannedQueries();
  console.log("Planned Queries:", plannedQueries);
  if (plannedQueries.length > 0) {
    plannedQueries.forEach((query) => {
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
