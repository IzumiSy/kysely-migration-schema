import { loadConfig } from "c12";
import { configSchema, ConfigValue } from "./schema";

export const loadConfigFile = async () => {
  const loadedConfig = await loadConfig<ConfigValue>({
    name: "kysely-schema",
  });
  return configSchema.parse(loadedConfig.config);
};
