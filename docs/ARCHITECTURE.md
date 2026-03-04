# METAMEN100 — Architecture & Dependency Policy

## Dependency Versioning Policy

### Version Pinning Strategy

| Package                | Prefix      | Rationale                                                                            |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `next`                 | `~` (tilde) | Major/minor updates require explicit team decision. Tilde allows only patch updates. |
| `react`, `react-dom`   | `~` (tilde) | Core rendering library — patch-only updates to avoid breaking changes.               |
| All other dependencies | `^` (caret) | Allow minor + patch updates for bug fixes and non-breaking features.                 |

### Rules

1. **pnpm-lock.yaml** MUST always be committed. Never add it to `.gitignore`.
2. Major version updates (e.g., Next.js 15 → 16) require an explicit ADR (Architecture Decision Record) and team approval.
3. Run `pnpm install --frozen-lockfile` in CI. Never use `--no-frozen-lockfile` in CI pipelines.
4. Dependency updates should be done in dedicated PRs, never bundled with feature work.
5. `packageManager` field in `package.json` pins the exact pnpm version (`pnpm@9.15.0`). Do not change without team decision.
6. Node.js engine requirement: `>=20.0.0`. Do not lower this.

## Approved Dependencies (MVP)

Only these dependencies are authorized for the MVP phase. Adding any dependency not on this list requires team approval.

### Production Dependencies

| Package                    | Version             | Purpose                                  |
| -------------------------- | ------------------- | ---------------------------------------- |
| `next`                     | `~15.5.12`          | App framework (App Router)               |
| `react`                    | `~19.0.0`           | UI rendering                             |
| `react-dom`                | `~19.0.0`           | React DOM renderer                       |
| `@supabase/supabase-js`    | `^2.47.0`           | Supabase client                          |
| `@supabase/ssr`            | `^0.5.0`            | Supabase SSR helpers                     |
| `@google/generative-ai`    | `^0.21.0`           | Gemini 2.5 Flash SDK                     |
| `inngest`                  | `^3.0.0`            | Background job processing                |
| `@upstash/redis`           | `^1.36.3`           | Redis client for rate limiting           |
| `@upstash/ratelimit`       | `^2.0.8`            | Rate limiting library                    |
| `react-hook-form`          | `^7.54.0`           | Form state management                    |
| `@hookform/resolvers`      | `^3.9.0`            | Form validation resolvers                |
| `zod`                      | `^3.23.0`           | Schema validation                        |
| `@t3-oss/env-nextjs`       | `^0.11.0`           | Env variable validation                  |
| `@radix-ui/react-tooltip`  | `^1.1.0`            | Accessible tooltip primitive             |
| `@radix-ui/react-dialog`   | `^1.1.0`            | Accessible dialog primitive              |
| `@radix-ui/react-slot`     | `^1.1.0`            | Slot pattern primitive                   |
| `class-variance-authority` | `^0.7.0`            | Component variant API                    |
| `clsx`                     | `^2.0.0`            | Conditional classnames                   |
| `tailwind-merge`           | `^2.0.0`            | Tailwind class deduplication             |
| `sonner`                   | `^1.7.0`            | Toast notifications                      |
| `lucide-react`             | `^0.469.0`          | Icon library                             |
| `posthog-js`               | `^1.357.1`          | Client-side analytics                    |
| `posthog-node`             | `^5.26.2`           | Server-side analytics                    |
| `stripe`                   | (not yet installed) | Payment processing — approved for CAJA_9 |

### Dev Dependencies

| Package                            | Version   | Purpose                     |
| ---------------------------------- | --------- | --------------------------- |
| `typescript`                       | `^5.7.0`  | Type safety                 |
| `vitest`                           | `^2.1.0`  | Test runner                 |
| `@vitest/coverage-v8`              | `^2.1.9`  | Code coverage               |
| `@testing-library/react`           | `^16.1.0` | React component testing     |
| `@testing-library/jest-dom`        | `^6.6.0`  | DOM matchers                |
| `fast-check`                       | `^3.0.0`  | Property-based testing      |
| `@vitejs/plugin-react`             | `^4.3.0`  | Vitest React support        |
| `jsdom`                            | `^25.0.0` | DOM environment for tests   |
| `eslint`                           | `^9.17.0` | Linting                     |
| `eslint-config-next`               | `^15.1.0` | Next.js ESLint config       |
| `eslint-config-prettier`           | `^10.1.8` | ESLint + Prettier compat    |
| `@eslint/eslintrc`                 | `^3.2.0`  | Flat config compat          |
| `@typescript-eslint/eslint-plugin` | `^8.56.1` | TS linting rules            |
| `@typescript-eslint/parser`        | `^8.56.1` | TS parser for ESLint        |
| `eslint-plugin-import-x`           | `^4.16.1` | Import order rules          |
| `eslint-plugin-react-hooks`        | `^7.0.1`  | React Hooks rules           |
| `eslint-plugin-security`           | `^4.0.0`  | Security linting            |
| `prettier`                         | `^3.8.1`  | Code formatting             |
| `prettier-plugin-tailwindcss`      | `^0.7.2`  | Tailwind class sorting      |
| `husky`                            | `^9.1.7`  | Git hooks                   |
| `lint-staged`                      | `^16.3.1` | Pre-commit linting          |
| `@commitlint/cli`                  | `^20.4.2` | Commit message linting      |
| `@commitlint/config-conventional`  | `^20.4.2` | Conventional commits config |
| `tailwindcss`                      | `^4.0.0`  | Styling framework           |
| `@tailwindcss/postcss`             | `^4.2.1`  | Tailwind v4 PostCSS plugin  |
| `@types/node`                      | `^22.0.0` | Node.js type definitions    |
| `@types/react`                     | `^19.0.0` | React type definitions      |
| `@types/react-dom`                 | `^19.0.0` | React DOM type definitions  |

## Prohibited Dependencies

The following are **explicitly banned** for the MVP. Do not install under any circumstance:

| Package                 | Reason                                            |
| ----------------------- | ------------------------------------------------- |
| `framer-motion`         | CSS transitions only for MVP                      |
| `@tanstack/react-query` | Not needed — Server Components + Server Actions   |
| `zustand`               | Not needed — React 19 context + Server Components |
| `axios`                 | Not needed — native fetch                         |
| `lodash`                | Not needed — native JS methods                    |
| `prisma`                | Using Supabase client directly                    |
| `trpc`                  | Using Server Actions                              |
| `mongodb`               | PostgreSQL only via Supabase                      |
| `firebase`              | Using Supabase                                    |
| `replicate`             | Using Gemini 2.5 Flash                            |
| `fal.ai`                | Using Gemini 2.5 Flash                            |
| `dall-e`                | Using Gemini 2.5 Flash                            |
| `resend`                | Not in MVP scope                                  |

## Tailwind CSS v4 Note

Tailwind CSS v4 does NOT use `tailwind.config.ts`. Configuration is done via:

- `src/app/globals.css` with `@import "tailwindcss";`
- PostCSS uses `@tailwindcss/postcss`

Do NOT create a `tailwind.config.ts` file.

## ESLint 9 Note

ESLint 9 uses flat config (`eslint.config.mjs`), NOT `.eslintrc.json`.
Requires `@eslint/eslintrc` as devDependency for the `FlatCompat` wrapper.
