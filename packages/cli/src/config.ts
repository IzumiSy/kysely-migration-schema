import { loadConfig } from "c12";
import { configSchema, ConfigValue } from "./schema";

export const loadConfigFile = async () => {
  const loadedConfig = await loadConfig<ConfigValue>({
    name: "kyrage",
  });

  if (loadedConfig.config?.tables) {
    const originalTables = loadedConfig.config.tables as Record<
      string,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      any
    >;
    const newTables: ConfigValue["tables"] = {};

    for (const key in originalTables) {
      const tableDef = originalTables[key];
      if (tableDef && tableDef._kyrage_table_name) {
        const { _kyrage_table_name, ...columns } = tableDef;
        newTables[_kyrage_table_name] = columns;
      } else {
        newTables[key] = tableDef;
      }
    }
    loadedConfig.config.tables = newTables;
  }

  return configSchema.parse(loadedConfig.config);
};
