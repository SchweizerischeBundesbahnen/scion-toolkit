// @ts-check
const eslint = require("@eslint/js");
const stylistic = require("@stylistic/eslint-plugin");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const rxjs = require('@smarttools/eslint-plugin-rxjs');

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      // https://eslint.org/docs/latest/rules/
      eslint.configs.recommended,
      // https://typescript-eslint.io/getting-started/typed-linting/
      ...tseslint.configs.recommendedTypeChecked,
      {
        languageOptions: {
          parserOptions: {
            projectService: true,
          },
        },
      },
      ...tseslint.configs.stylisticTypeChecked,
      // https://github.com/angular-eslint/angular-eslint/blob/main/packages/angular-eslint/src/configs/README.md
      ...angular.configs.tsRecommended,
      // https://eslint.style/packages/default
      stylistic.configs.customize({
        semi: true,
        jsx: false,
        blockSpacing: false,
      }),
      // https://github.com/DaveMBush/eslint-plugin-rxjs?tab=readme-ov-file#rules
      rxjs.configs.recommended,
    ],
    // https://github.com/angular-eslint/angular-eslint/blob/main/docs/CONFIGURING_FLAT_CONFIG.md#notes-on-eslint-configuration
    processor: angular.processInlineTemplates,
    rules: {
      // https://typescript-eslint.io/rules/
      "@typescript-eslint/explicit-function-return-type": ["error", {
        allowExpressions: true,
      }],
      "@typescript-eslint/explicit-member-accessibility": ["error", {
        accessibility: "explicit",
        overrides: {
          constructors: "no-public",
        },
      }],
      "@typescript-eslint/member-ordering": ["error", {
        default: [
          "static-field",
          "instance-field",
          "constructor",
          "instance-method",
          "static-method",
        ],
      }],
      "@typescript-eslint/no-empty-function": ["error", {
        allow: ["private-constructors"],
      }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-expressions": ["error", {
        allowShortCircuit: true,
        allowTernary: true,
      }],
      "@typescript-eslint/no-unused-vars": ["error", {
        args: "none",
      }],
      "@typescript-eslint/typedef": ["error", {
        parameter: true,
        propertyDeclaration: true,
      }],
      "@typescript-eslint/no-deprecated": "warn",
      // https://eslint.style/packages/default
      "@stylistic/object-curly-spacing": ["error", "never"],
      "@stylistic/arrow-parens": ["error", "as-needed"],
      "@stylistic/padded-blocks": "off", // was not  default either fix or turn off
      "@stylistic/operator-linebreak": "off", // was not  default either fix or turn off
      "@stylistic/implicit-arrow-linebreak": "error",
      "@stylistic/nonblock-statement-body-position": "error",
      // https://github.com/DaveMBush/eslint-plugin-rxjs?tab=readme-ov-file#rules
      "@smarttools/rxjs/no-implicit-any-catch": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      // https://github.com/angular-eslint/angular-eslint/blob/main/packages/angular-eslint/src/configs/README.md
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
