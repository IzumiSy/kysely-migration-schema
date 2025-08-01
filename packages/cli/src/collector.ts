import {
  CompiledQuery,
  DatabaseConnection,
  QueryResult,
  DummyDriver,
} from "kysely";

export class SQLCollectingDriver extends DummyDriver {
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
