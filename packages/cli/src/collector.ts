import {
  CompiledQuery,
  DatabaseConnection,
  QueryResult,
  Dialect,
  DummyDriver,
} from "kysely";

class SqlCollectingDriver extends DummyDriver {
  constructor(private queries: CompiledQuery[]) {
    super();
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new DummyConnection(this.queries);
  }
}

class DummyConnection implements DatabaseConnection {
  constructor(private queries: CompiledQuery[]) {}

  async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
    this.queries.push(query);
    return {
      rows: [],
    };
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    // Nothing to do here.
  }
}

export const wrapDialect = (
  dialect: Dialect,
  queries: CompiledQuery[]
): Dialect => {
  return {
    createAdapter: () => dialect.createAdapter(),
    createDriver: () => new SqlCollectingDriver(queries),
    createIntrospector: (db) => dialect.createIntrospector(db),
    createQueryCompiler: () => dialect.createQueryCompiler(),
  };
};
