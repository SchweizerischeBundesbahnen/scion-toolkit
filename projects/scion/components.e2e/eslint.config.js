// @ts-check
const tseslint = require("typescript-eslint");
const rootConfig = require("../../../eslint.config.js");

module.exports = tseslint.config(
  ...rootConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "projects/scion/components.e2e/tsconfig.spec.json",
      },
    },
    rules: {},
  },
  {
    files: ["**/*.html"],
    rules: {},
  },
);
