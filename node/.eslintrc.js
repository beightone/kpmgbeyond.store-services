const path = require('path');

module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    // AQUI ESTÁ A MÁGICA: O __dirname diz "o tsconfig está nesta mesma pasta"
    project: [path.resolve(__dirname, './tsconfig.json')],
    tsconfigRootDir: __dirname
  },
  plugins: ["@typescript-eslint", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/no-unnecessary-type-constraint": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/triple-slash-reference": "off",
    "no-console": "error",
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "axios",
            "message": "CRITICAL: Direct use of axios is forbidden. Create a Client class in /node/clients extending ExternalClient."
          },
          {
            "name": "node-fetch",
            "message": "CRITICAL: Direct use of fetch is forbidden. Create a Client class in /node/clients extending ExternalClient."
          },
          {
            "name": "request",
            "message": "CRITICAL: Direct use of request is forbidden. Use VTEX IO Clients."
          },
          {
            "name": "got",
            "message": "CRITICAL: Direct use of got is forbidden. Use VTEX IO Clients."
          }
        ]
      }
    ],
    "no-await-in-loop": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "eqeqeq": ["error", "always"],
    "no-var": "error",
    "prefer-const": "error",
    "no-throw-literal": "error",
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }
    ]
  }
};
