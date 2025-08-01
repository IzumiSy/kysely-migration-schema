import {
  DatabaseIntrospector,
  Kysely,
  PostgresDialect,
  PostgresIntrospector,
} from "kysely";
import { Pool } from "pg";
import { loadConfig } from "c12";
import { ConfigType, DialectEnum, configSchema } from "./schema.js";

const main = async () => {
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

  const introspector = await getIntrospector({
    ...parsedConfig.database,
  });

  const tables = await getTablesFromIntrospection(introspector);

  for (const table of tables) {
    console.log(`table: ${table.name}`);
    console.log(`isView: ${table.isView}`);
  }
};

const getTablesFromIntrospection = async (
  introspector: DatabaseIntrospector
) => {
  const tables = await introspector.getTables();
  return tables;
};

type GetIntrospectorProps = {
  dialect: DialectEnum;
  connectionString: string;
};

const getIntrospector = async (props: GetIntrospectorProps) => {
  switch (props.dialect) {
    case "postgres":
      return new PostgresIntrospector(
        new Kysely({
          dialect: new PostgresDialect({
            pool: new Pool({
              connectionString: props.connectionString,
            }),
          }),
        })
      );
    default:
      throw new Error(`Unsupported dialect: ${props.dialect}`);
  }
};

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
