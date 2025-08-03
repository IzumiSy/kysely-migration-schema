import { Kysely, PostgresDialect } from "kysely";
import { DialectEnum } from "./schema";
import { Pool } from "pg";

export const getConnection = async (props: {
  database: {
    dialect: DialectEnum;
    connectionString: string;
  };
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

  const db = new Kysely({
    dialect: getDialect(),
  });

  return { db };
};
