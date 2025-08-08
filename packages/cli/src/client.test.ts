import { afterAll, beforeAll, describe, it } from "vitest";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { getClient } from "./client";
import { sql } from "kysely";

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:14").start();
});

describe("PostgreSQL Container", () => {
  it("should create DBClient", async () => {
    const connectionString = container.getConnectionUri();

    const client = await getClient({
      database: {
        dialect: "postgres",
        connectionString,
      },
    });

    const db = client.getDB();

    const r = await sql`select 1`.execute(db);

    console.log(r);
  });
});

afterAll(async () => {
  await container.stop();
});
