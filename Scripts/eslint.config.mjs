export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        InternalError: "readonly",
      },
    },
    files: ["**/*.js"],
    ignores: [
      "**/_BaseConfigFile.js",
      "**/test.js",
      "**/tools.js",
      "**/OrgTorch.js",
    ],
    rules: {
      // "no-console": "off",
      // "no-console": ["error", { allow: ["warn", "error"] }],
      "no-unused-vars": ["warn", { caughtErrors: "none" }],
      "no-undef": "error",
    },
  },
];
