import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/.output/**", "**/.wxt/**", "**/node_modules/**", "**/dist/**"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);
