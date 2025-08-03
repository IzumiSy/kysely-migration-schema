import { CompiledQuery, Kysely, PostgresDialect } from "kysely";
import { DialectEnum } from "./schema";
import { Pool } from "pg";
import { SQLCollectingDriver } from "./collector";

export const getIntrospector = async (props: {
  database: {
    dialect: DialectEnum;
    connectionString: string;
  };
  plannedQueries: CompiledQuery[];
  plan: boolean;
}) => {
  const getDialect = () => {
    switch (props.database.dialect) {
      case "postgres": {
        return new PostgresDialect({
          pool: new Pool({
            connectionString: props.database.connectionString,
          }),
        });
      }
      default:
        throw new Error(`Unsupported dialect: ${props.database.dialect}`);
    }
  };

  const dialect = getDialect();
  const db = new Kysely({
    dialect: {
      createAdapter: () => dialect.createAdapter(),
      createDriver: () =>
        props.plan
          ? new SQLCollectingDriver(props.plannedQueries)
          : dialect.createDriver(),
      createIntrospector: (db) => dialect.createIntrospector(db),
      createQueryCompiler: () => dialect.createQueryCompiler(),
    },
  });

  return { db };
};
