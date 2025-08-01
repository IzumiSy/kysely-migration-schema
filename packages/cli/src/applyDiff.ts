import { Kysely } from "kysely";
import { TableDiff } from "./diff";

/**
 * TableDiffの内容をDBに適用する
 * @param db Kyselyインスタンス
 * @param diff TableDiff
 */
export async function applyDiff(
  db: Kysely<any>,
  diff: TableDiff
): Promise<void> {
  // 1. 追加テーブル
  for (const added of diff.addedTables) {
    let builder = db.schema.createTable(added.table);
    for (const [colName, colDef] of Object.entries(added.columns)) {
      // 最低限 typeのみ対応（拡張は後で）
      builder = builder.addColumn(colName, colDef.type as any);
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
      await db.schema
        .alterTable(changed.table)
        .addColumn(addCol.column, addCol.definition.type as any)
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
        .alterColumn(chCol.column, (col) =>
          col.setDataType(chCol.after.type as any)
        )
        .execute();
    }
  }
}
