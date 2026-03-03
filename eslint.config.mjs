import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import security from "eslint-plugin-security";
import importPlugin from "eslint-plugin-import-x";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // ── Global ignores ──────────────────────────────────────
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "coverage/**",
      "*.config.mjs",
      "*.config.js",
    ],
  },

  // ── Next.js defaults (legacy extends via FlatCompat) ───
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // ── TypeScript strict overrides ────────────────────────
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  // ── Import ordering (eslint-plugin-import-x) ──────────
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "import-x": importPlugin,
    },
    settings: {
      "import-x/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      // Off: TypeScript path aliases (@/*) causan falsos positivos en resolución
      "import-x/no-unresolved": "off",
      "import-x/no-duplicates": "error",
      "import-x/first": "error",
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          pathGroups: [
            { pattern: "react", group: "builtin", position: "before" },
            { pattern: "react-dom/**", group: "builtin", position: "before" },
            { pattern: "next/**", group: "external", position: "before" },
            { pattern: "@/components/**", group: "internal", position: "before" },
            { pattern: "@/hooks/**", group: "internal", position: "after" },
            { pattern: "@/stores/**", group: "internal", position: "after" },
            { pattern: "@/lib/core/**", group: "internal", position: "after" },
            { pattern: "@/lib/server/actions/**", group: "internal", position: "after" },
            { pattern: "@/lib/**", group: "internal", position: "after" },
            { pattern: "@/types/**", group: "internal", position: "after" },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  // ── Security plugin (flat nativo, SIN FlatCompat) ──────
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"],
    plugins: {
      security,
    },
    rules: {
      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-object-injection": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-unsafe-regex": "error",
    },
  },
];

export default eslintConfig;
