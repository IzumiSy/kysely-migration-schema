import { afterAll, beforeAll, describe, it, vi, expect } from "vitest";
import {
  StartedPostgreSqlContainer,
  PostgreSqlContainer,
} from "@testcontainers/postgresql";
import { DBClient, getClient } from "../src/client";
import { runGenerate } from "../src/usecases/generate";
import { column, defineTable } from "../src//config/builder";
import { defineConfig } from "../src/config/builder";
import { configSchema, ConfigValue } from "../src/schema";
import { readdir } from "fs/promises";
import { runApply } from "../src/usecases/apply";

vi.mock("fs/promises", async () => {
  const memfs = await import("memfs");
  return memfs.fs.promises;
});

let container: StartedPostgreSqlContainer;
let config: ConfigValue;
let client: DBClient;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:14").start();
  config = configSchema.parse(
    defineConfig({
      database: {
        dialect: "postgres" as const,
        connectionString: container.getConnectionUri(),
      },
      tables: [
        defineTable("members", {
          id: column("uuid", { primaryKey: true }),
        }),
      ],
    })
  );
  client = getClient({
    database: config.database,
  });
});

describe("generate and apply", () => {
  it("should generate a migration file", async () => {
    await runGenerate({
      client,
      config,
      options: {
        ignorePending: false,
        apply: false,
        plan: false,
      },
    });

    const files = await readdir("migrations");

    expect(files).toHaveLength(1);
  });

  it("should apply the migration", async () => {
    await runApply({
      client,
      options: {
        plan: false,
      },
    });

    await using db = client.getDB();
    const tables = await db.introspection.getTables();

    expect(tables).toHaveLength(1);

    const table = tables[0];
    expect(table.name).toBe("members");
    expect(table.columns).toHaveLength(1);
    expect(table.columns[0]).toEqual(
      expect.objectContaining({
        name: "id",
        dataType: "uuid",
      })
    );
  });
});

afterAll(async () => {
  await container.stop();
});
