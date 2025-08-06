import { Kysely, MysqlDialect, PostgresDialect, SqliteDialect } from "kysely";
import { DialectEnum } from "./schema";
import { Pool } from "pg";
import { createPool } from "mysql2";
import Database from "better-sqlite3";
import { CockroachDBDialect } from "./dialects/cockroachdb";

export const getClient = async (props: {
  database: {
    dialect: DialectEnum;
    connectionString: string;
  };
}) => {
  const getDialect = () => {
    switch (props.database.dialect) {
      case "cockroachdb": {
        return new CockroachDBDialect({
          pool: new Pool({
            connectionString: props.database.connectionString,
          }),
        });
      }
      case "postgres": {
        return new PostgresDialect({
          pool: new Pool({
            connectionString: props.database.connectionString,
          }),
        });
      }
      case "mysql": {
        return new MysqlDialect({
          pool: createPool(props.database.connectionString),
        });
      }
      case "sqlite": {
        return new SqliteDialect({
          database: new Database(props.database.connectionString),
        });
      }
      default:
        throw new Error(`Unsupported dialect: ${props.database.dialect}`);
    }
  };

  return {
    db: new Kysely<any>({
      dialect: getDialect(),
    }),
  };
};
