/// <reference types="node" />
import { defineConfig } from "tsup";

const devOpts =
  process.env.NODE_ENV === "development"
    ? {
        minify: false,
        sourcemap: true,
        splitting: false,
      }
    : {};

export default defineConfig({
  format: ["esm"],
  entryPoints: ["src/main.ts"],
  dts: true,
  minify: true,
  clean: true,
  ...devOpts,
});
