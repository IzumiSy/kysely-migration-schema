export type TableColumnAttributes = {
  type: string;
  [key: string]: unknown;
};

export type TableDef = Record<string, TableColumnAttributes>;
export type Tables = Record<string, TableDef>;

// 追加テーブル
export type AddedTable = {
  table: string;
  columns: TableDef;
};

// 削除テーブル（テーブル名のみでOK）
export type RemovedTable = string;

// 追加カラム
export type AddedColumn = {
  column: string;
  attributes: TableColumnAttributes;
};

// 削除カラム
export type RemovedColumn = {
  column: string;
  attributes: TableColumnAttributes;
};

// 型変更カラム
export type ChangedColumn = {
  column: string;
  before: TableColumnAttributes;
  after: TableColumnAttributes;
};

// テーブルごとの変更
export type ChangedTable = {
  table: string;
  addedColumns: AddedColumn[];
  removedColumns: RemovedColumn[];
  changedColumns: ChangedColumn[];
};

// 全体のdiff
export type TableDiff = {
  addedTables: AddedTable[];
  removedTables: RemovedTable[];
  changedTables: ChangedTable[];
};

export function diffTables(props: {
  current: Tables;
  ideal: Tables;
}): TableDiff {
  const { current: currentTables, ideal: idealTables } = props;
  const dbTableNames = Object.keys(currentTables);
  const configTableNames = Object.keys(idealTables);

  // 追加テーブル: テーブル名＋カラム定義
  const addedTables = configTableNames
    .filter((t) => !dbTableNames.includes(t))
    .map((table) => ({
      table,
      columns: idealTables[table],
    }));

  // 削除テーブル: テーブル名のみ
  const removedTables = dbTableNames.filter(
    (t) => !configTableNames.includes(t)
  );

  // テーブルごとのカラム差分
  const changedTables = dbTableNames.reduce<ChangedTable[]>((acc, table) => {
    if (!configTableNames.includes(table)) return acc;
    const dbCols = currentTables[table];
    const configCols = idealTables[table];
    const dbColNames = Object.keys(dbCols);
    const configColNames = Object.keys(configCols);

    // 追加カラム: カラム名＋型情報
    const addedColumns = configColNames
      .filter((c) => !dbColNames.includes(c))
      .map((column) => ({
        column,
        attributes: configCols[column],
      }));

    // 削除カラム: カラム名＋型情報（削除前の型）
    const removedColumns = dbColNames
      .filter((c) => !configColNames.includes(c))
      .map((column) => ({
        column,
        attributes: dbCols[column],
      }));

    // 型変更カラム: before/after型情報
    // Changes on primaryKey and unique are not supported in current implementation
    const changedColumns = dbColNames
      .filter(
        (c) =>
          configColNames.includes(c) &&
          (dbCols[c].type !== configCols[c].type ||
            dbCols[c].notNull !== configCols[c].notNull)
      )
      .map((column) => ({
        column,
        before: dbCols[column],
        after: configCols[column],
      }));

    if (
      addedColumns.length > 0 ||
      removedColumns.length > 0 ||
      changedColumns.length > 0
    ) {
      acc.push({
        table,
        addedColumns,
        removedColumns,
        changedColumns,
      });
    }
    return acc;
  }, []);

  return {
    addedTables,
    removedTables,
    changedTables,
  };
}
