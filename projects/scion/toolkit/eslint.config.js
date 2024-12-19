// @ts-check
const tseslint = require("typescript-eslint");
const rootConfig = require("../../../eslint.config.js");

module.exports = tseslint.config(
  ...rootConfig,
  {
    files: ["**/*.ts"],
    // languageOptions: {
    //   parserOptions: {
    //     projectService: true,
    //     project: "projects/scion/toolkit/tsconfig.(lib|spec).json",
    //   },
    // },
    rules: {},
  },
  {
    files: ["**/*.html"],
    rules: {},
  },
);
