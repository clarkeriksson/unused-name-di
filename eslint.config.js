import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";

const vueRules = Object.keys(pluginVue.rules);
const vueAllOff = Object.fromEntries(vueRules.map(name => [name ?? "", "off"]));
//process.stdout.write(JSON.stringify(vueAllOff, undefined, 2));

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"], rules: { ...vueAllOff } },
  { files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc", extends: ["json/recommended"], rules: { ...vueAllOff } },
  { files: ["**/*.json5"], plugins: { json }, language: "json/json5", extends: ["json/recommended"], rules: { ...vueAllOff } },
]);
