import { ColumnDataType, isColumnDataType, Kysely } from "kysely";
import { TableDiff } from "./diff";
import { Xid } from "xid-ts";

type CreateMigrationProviderProps = {
  db: Kysely<unknown>;
  diff: TableDiff;
};

export const createMigrationProvider = (
  props: CreateMigrationProviderProps
) => {
  const nextMigration = {
    up: async () => {
      await buildMigrationFromDiff(props.db, props.diff);
    },
  };

  return {
    getMigrations: async () => {
      const xid = new Xid();
      const migrationID = xid.toString();

      return {
        [migrationID]: nextMigration,
      };
    },
  };
};

export async function buildMigrationFromDiff(
  db: Kysely<unknown>,
  diff: TableDiff
): Promise<void> {
  // 1. 追加テーブル
  for (const added of diff.addedTables) {
    let builder = db.schema.createTable(added.table);
    for (const [colName, colDef] of Object.entries(added.columns)) {
      const dataType = colDef.type;
      assertDataType(dataType);
      // 最低限typeのみ対応（拡張は後で）
      builder = builder.addColumn(colName, dataType);
    }
    await builder.execute();
  }

  // 2. 削除テーブル
  for (const removed of diff.removedTables) {
    await db.schema.dropTable(removed).execute();
  }

  // 3. 変更テーブル
  for (const changed of diff.changedTables) {
    // 追加カラム
    for (const addCol of changed.addedColumns) {
      const dataType = addCol.definition.type;
      assertDataType(dataType);
      await db.schema
        .alterTable(changed.table)
        .addColumn(addCol.column, dataType)
        .execute();
    }
    // 削除カラム
    for (const remCol of changed.removedColumns) {
      await db.schema
        .alterTable(changed.table)
        .dropColumn(remCol.column)
        .execute();
    }
    // 型変更カラム
    for (const chCol of changed.changedColumns) {
      await db.schema
        .alterTable(changed.table)
        .alterColumn(chCol.column, (col) => {
          const dataType = chCol.after.type;
          assertDataType(dataType);
          return col.setDataType(dataType);
        })
        .execute();
    }
  }
}

const assertDataType: (
  dataType: string
) => asserts dataType is ColumnDataType = (dataType) => {
  if (!isColumnDataType(dataType)) {
    throw new Error(`Unsupported data type: ${dataType}`);
  }
};
