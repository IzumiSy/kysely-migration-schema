import { PostgresAdapter, PostgresDialect } from "kysely";

// Ref: https://github.com/kysely-org/kysely/issues/325#issuecomment-1426878934
class CockroachDBAdapter extends PostgresAdapter {
  override get supportsTransactionalDdl() {
    return false;
  }

  override async acquireMigrationLock(): Promise<void> {
    // CockroachDB does not support transactional DDL, so we do not need to acquire a lock.
  }
}

export class CockroachDBDialect extends PostgresDialect {
  override createAdapter() {
    return new CockroachDBAdapter();
  }
}
