import { loadConfig } from "c12";
import { ConfigType, configSchema } from "./schema.js";

const loadedConfig = await loadConfig<ConfigType>({
  name: "kysely-schema",
});

const parsedConfig = configSchema.safeParse(loadedConfig.config);
if (!parsedConfig.success) {
  console.error("Invalid config:", parsedConfig.error);
  process.exit(1);
}

console.log(parsedConfig);
