import { afterAll, beforeAll, describe, it, expect } from "vitest";
import {
  StartedPostgreSqlContainer,
  PostgreSqlContainer,
} from "@testcontainers/postgresql";
import { getClient } from "../client";
import { runGenerate } from "./generate";
import { column, defineTable } from "../config/builder";
import { defineConfig } from "../config/loader";

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:14").start();
});

describe("generate usecase", () => {
  it("should generate a migration file", async () => {
    const config = defineConfig({
      database: {
        dialect: "postgres" as const,
        connectionString: container.getConnectionUri(),
      },
      tables: [
        defineTable("members", {
          id: column("uuid", { primaryKey: true }),
        }),
      ],
    });
    const client = getClient({
      database: config.database,
    });

    await runGenerate({
      client,
      config,
      options: {
        ignorePending: false,
        apply: false,
        plan: false,
      },
    });
  });
});

afterAll(async () => {
  await container.stop();
});
