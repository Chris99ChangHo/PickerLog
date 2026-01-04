module.exports = {
  root: true,
  extends: ["@react-native/eslint-config", "plugin:react-hooks/recommended", "prettier"],
  env: {
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  ignorePatterns: ["dist/", "build/", "node_modules/"],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        "@typescript-eslint/consistent-type-imports": "warn",
      },
    },
  ],
  rules: {
    "react-hooks/exhaustive-deps": "warn",
  },
};
