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
  it("should be switchable to plan mode", async () => {
    const connectionString = container.getConnectionUri();

    await using client = await getClient({
      database: {
        dialect: "postgres",
        connectionString,
      },
    });

    const actualDB = client.getDB();

    await actualDB.schema
      .createTable("test_table")
      .addColumn("id", "serial", (col) => col.primaryKey())
      .execute();

    const tablesBefore = await actualDB.introspection.getTables();

    expect(tablesBefore).toHaveLength(1);
    expect(tablesBefore[0].name).toBe("test_table");

    await client.switch({
      plan: true,
    });

    const plannedDB = client.getDB();

    await plannedDB.schema.dropTable("test_table").execute();

    const tablesAfter = await plannedDB.introspection.getTables();

    expect(tablesAfter).toHaveLength(1);
    expect(tablesAfter[0].name).toBe("test_table");
  });
});

afterAll(async () => {
  await container.stop();
});
