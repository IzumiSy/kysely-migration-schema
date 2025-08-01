export type TableColumnDef = {
  type: string;
  [key: string]: unknown;
};

export type TableDef = Record<string, TableColumnDef>;
export type Tables = Record<string, TableDef>;

type ChangedColumn = {
  column: string;
  dbType: string;
  configType: string;
};

type ChangedTable = {
  table: string;
  addedColumns: string[];
  removedColumns: string[];
  changedColumns: ChangedColumn[];
};

type TableDiff = {
  addedTables: string[];
  removedTables: string[];
  changedTables: ChangedTable[];
};

export function diffTables(dbTables: Tables, configTables: Tables): TableDiff {
  const dbTableNames = Object.keys(dbTables);
  const configTableNames = Object.keys(configTables);

  // テーブルの追加・削除
  const addedTables = configTableNames.filter((t) => !dbTableNames.includes(t));
  const removedTables = dbTableNames.filter(
    (t) => !configTableNames.includes(t)
  );

  // テーブルごとのカラム差分
  const changedTables = dbTableNames.reduce<ChangedTable[]>((acc, table) => {
    if (!configTableNames.includes(table)) return acc;
    const dbCols = dbTables[table];
    const configCols = configTables[table];
    const dbColNames = Object.keys(dbCols);
    const configColNames = Object.keys(configCols);

    const addedColumns = configColNames.filter((c) => !dbColNames.includes(c));
    const removedColumns = dbColNames.filter(
      (c) => !configColNames.includes(c)
    );

    const changedColumns = dbColNames.flatMap((c) => {
      if (configColNames.includes(c) && dbCols[c].type !== configCols[c].type) {
        return [
          {
            column: c,
            dbType: dbCols[c].type,
            configType: configCols[c].type,
          },
        ];
      }
      return [];
    });

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
