import { afterAll, beforeAll, describe, it, expect } from "vitest";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { getClient } from "./client";

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:14").start();
});

describe("DBClient", () => {
  it("should be switchable to plan mode and able to be back", async () => {
    const client = getClient({
      database: {
        dialect: "postgres",
        connectionString: container.getConnectionUri(),
      },
    });

    /**
     * Check that the test table is created in non-plan mode
     */
    await using actualDB = client.getDB();
    await actualDB.schema
      .createTable("test_table")
      .addColumn("id", "serial", (col) => col.primaryKey())
      .execute();
    const tablesBefore = await actualDB.introspection.getTables();
    expect(tablesBefore).toHaveLength(1);
    expect(tablesBefore[0].name).toBe("test_table");

    /**
     * Check that the test table is not created in plan mode
     */
    await using plannedDB = client.getDB({
      plan: true,
    });
    await plannedDB.schema.dropTable("test_table").execute();

    /**
     * Check that tables were not affected in the plan mode
     */
    const tablesAfter = await actualDB.introspection.getTables();
    expect(tablesAfter).toHaveLength(1);
    expect(tablesAfter[0].name).toBe("test_table");
  });
});

afterAll(async () => {
  await container.stop();
});
