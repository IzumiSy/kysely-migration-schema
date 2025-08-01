import { Kysely, PostgresDialect, PostgresIntrospector } from "kysely";
import { Pool } from "pg";
import { DialectEnum } from "./schema";

export const getIntrospector = async (props: {
  dialect: DialectEnum;
  connectionString: string;
}) => {
  switch (props.dialect) {
    case "postgres": {
      const db = new Kysely({
        dialect: new PostgresDialect({
          pool: new Pool({
            connectionString: props.connectionString,
          }),
        }),
      });
      return { introspector: new PostgresIntrospector(db), db };
    }
    default:
      throw new Error(`Unsupported dialect: ${props.dialect}`);
  }
};
