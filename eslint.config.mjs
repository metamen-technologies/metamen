import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import security from "eslint-plugin-security";

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
