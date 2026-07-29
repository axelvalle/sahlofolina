import js from "@eslint/js";
import globals from "globals";

const eslintConfig = [
  {
    ignores: [
      "dist/**",
      ".next/**",
      ".vinext/**",
      "node_modules/**",
      "out/**",
      "build/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];

export default eslintConfig;
