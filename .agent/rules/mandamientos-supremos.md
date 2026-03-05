---
trigger: always_on
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# METAMEN100 — PROJECT RULES

# ══════════════════════════════════════════════════════════════

# Este archivo es la CONSTITUCIÓN del proyecto.

# Todo agente de IA (Claude Code, Antigravity, Codex, Cursor)

# DEBE leer este archivo antes de ejecutar cualquier tarea.

# Ubicación: raíz del proyecto /CLAUDE.md

# Última actualización: 2026-02-21 (reset sesión inicial)

# ══════════════════════════════════════════════════════════════

## 0. DEVELOPMENT COMMANDS

```bash
# Development
pnpm dev          # Next.js dev server with Turbopack (port 3000)
pnpm build        # Production build
pnpm start        # Start production server

# Quality checks
pnpm lint         # ESLint (next lint)
pnpm typecheck    # tsc --noEmit
pnpm format       # Prettier --write src/**
pnpm format:check # Prettier --check src/**

# Testing
pnpm test              # Run all tests once (vitest run)
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report (v8, output: ./coverage/)

# Run a single test file
pnpm vitest run src/lib/core/vectors/vectors.test.ts

# Run tests matching a name pattern
pnpm vitest run --reporter=verbose -t "calculateScore"

# Full pre-flight (lint + typecheck + test)
pnpm verify

# Environment validation
pnpm env:check    # Validates all 17 env vars via scripts/validate-env.ts
```

**Package manager**: `pnpm` only (v9.15.0+, Node 20+). Never use `npm` or `yarn`.

**Path aliases** (tsconfig + vitest):

- `@/*` → `src/*`
- `@/core/*` → `src/lib/core/*`
- `@/actions/*` → `src/lib/server/actions/*` (note: NOT `src/actions/`)
- `@/components/*` → `src/components/*`
- `@/stores/*` → `src/stores/*`
- `@/types/*` → `src/types/*`

## 1. IDENTIDAD DEL PROYECTO

| Campo         | Valor                                                          |
| ------------- | -------------------------------------------------------------- |
| Nombre        | MetaMen100                                                     |
| Tipo          | Sistema Operativo de Conducta con IA generativa (gamificación) |
| Fase          | MVP v1.0                                                       |
| Estado actual | Sesión inicial (sin tareas ejecutadas)                         |
| Documentación | Ver `/docs/cajas/` para tareas por ejecutar                    |

## 2. TECH STACK

| Tecnología    | Versión    | Uso                                                                     |
| ------------- | ---------- | ----------------------------------------------------------------------- |
| Next.js       | 15.x       | Framework (App Router, Server Actions, Server Components)               |
| React         | 19.x       | UI                                                                      |
| TypeScript    | 5.x        | ultra-strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| Tailwind CSS  | v4         | Styling (dark mode, mobile-first)                                       |
| Supabase      | latest     | Auth + PostgreSQL + Storage + Realtime                                  |
| Stripe        | latest SDK | Pagos (Checkout hosted, Customer Portal, webhooks)                      |
| Gemini        | 2.5 Flash  | Generación de imágenes de avatar (pixel art)                            |
| Resend        | latest     | Email transaccional (4 templates)                                       |
| Upstash Redis | latest     | Rate limiting (auth, tasks, images)                                     |
| Inngest       | latest     | Background jobs (Judgement Night cron, image worker, emails)            |
| Vercel        | N/A        | Hosting + CI/CD auto-deploy                                             |
| Vitest        | latest     | Unit testing                                                            |
| Zod           | 3.x        | Validación de schemas en boundaries                                     |
| Zustand       | latest     | Client state management                                                 |
| Pino          | latest     | Structured logging                                                      |
| Sentry        | latest     | Error tracking                                                          |
| PostHog       | latest     | Analytics + funnel tracking                                             |

## 3. REGLAS ABSOLUTAS DE CÓDIGO

### TypeScript

- **CERO `any`** en todo el proyecto. Usar `unknown` + type narrowing.
- `noUncheckedIndexedAccess: true` — todo acceso a array/record puede ser undefined.
- `exactOptionalPropertyTypes: true` — `undefined` y optional son diferentes.
- `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`.

### Next.js

- **Server Components por defecto**. Solo `'use client'` cuando hay interactividad, hooks, o browser APIs.
- **Server Actions para TODA mutación** (escritura DB). Ubicación: `src/actions/`. NUNCA API routes para CRUD.
- **API routes** solo para: webhooks externos (Stripe, Inngest), health check.
- **Middleware** (`src/middleware.ts`) para protección de rutas auth.

### Motor del Juego (`src/lib/core/`)

- **100% funciones puras**: `f(input) → output`. Sin I/O, sin DB, sin fetch, sin side effects.
- **Result<T,E> monad**: Nunca `throw` en funciones puras. Usar `ok(data)` / `err(error)`.
- **Inmutabilidad**: Todo estado es `readonly`. Cada operación retorna nuevo estado.
- **Regla de capas**: Layer N solo importa de Layer ≤ N-1. NUNCA dependencias circulares.

### Imports y Naming

- **Siempre alias**: `@/lib/...`, `@/components/...`, `@/actions/...`. Nunca `../../..`.
- **Archivos**: kebab-case (`avatar-state.ts`).
- **Componentes**: PascalCase (`TaskCard.tsx`).
- **Funciones**: camelCase (`calculateOverallScore`).
- **Constantes**: UPPER_SNAKE_CASE (`VECTOR_WEIGHTS`).
- **Tipos/Interfaces**: PascalCase (`VectorState`).
- **Enums**: PascalCase con valores UPPER_SNAKE (`VectorName.AURA`).

### Testing

- **Vitest** para unit tests.
- Cada archivo en `src/lib/core/` DEBE tener su `.test.ts`.
- Tests de funciones puras: input → output, edge cases.
- Nombre de tests: `describe('functionName')` → `it('should [behavior] when [condition]')`.

### Commits

- **Conventional Commits obligatorio**.
- Formato: `tipo(ID_TAREA): descripción breve`
- Tipos: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`
- Ejemplo: `feat(02.1.1): init next.js 15 project with app router`
- Ejemplo: `test(04.1.2): add vector calculation unit tests`
- **Un commit por tarea ejecutada**.

### UI / Design

- **Mobile-first** obligatorio. Todo componente se diseña para 375px primero.
- **Dark mode** obligatorio. No hay light mode.
- **Color palette "Gentleman's Club"**:
  - `mm-black: #0A0A0B` (fondo principal)
  - `mm-gold: #C9A84C` (acento primario)
  - `mm-gold-light: #E5C76B` (acento hover)
  - `mm-charcoal: #1A1A2E` (superficies)
  - `mm-slate: #16213E` (cards/panels)
  - `mm-dark: #0F3460` (bordes/separadores)
  - `mm-red: #E94560` (danger, muerte, errores)
  - `mm-green: #27AE60` (success, tareas completadas)
  - `mm-blue: #3498DB` (info, links)

## 4. ESTRUCTURA DE DIRECTORIOS

```
metamen100/
├── CLAUDE.md                     ← ESTE ARCHIVO (rules)
├── BITACORA.md                   ← Estado actual del proyecto
├── docs/
│   └── cajas/                    ← Cajas MVP con tareas
│       ├── CAJA-MVP-02.md
│       ├── CAJA-MVP-03.md
│       └── ...
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Grupo: rutas públicas
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── auth/callback/route.ts
│   │   ├── (app)/                # Grupo: rutas protegidas
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       ├── layout.tsx
│   │   │       ├── tasks/page.tsx
│   │   │       ├── tools/page.tsx
│   │   │       └── profile/page.tsx
│   │   ├── api/
│   │   │   ├── webhooks/stripe/route.ts
│   │   │   ├── inngest/route.ts
│   │   │   └── health/route.ts
│   │   ├── layout.tsx            # Root layout
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   ├── actions/                  # Server Actions (mutaciones)
│   │   ├── auth/index.ts
│   │   ├── tasks/index.ts
│   │   ├── avatar/index.ts
│   │   ├── subscription/index.ts
│   │   └── onboarding/index.ts
│   ├── components/
│   │   ├── ui/                   # Atoms: Button, Card, Input, Badge
│   │   ├── layout/               # Shell, BottomNav, Header
│   │   ├── dashboard/            # AvatarDisplay, VectorHUD, TaskList
│   │   ├── onboarding/           # QuizStep, CharacterSelect, Oath
│   │   └── providers/            # PostHogProvider, ThemeProvider
│   ├── lib/
│   │   ├── core/                 # MOTOR DEL JUEGO (PURO)
│   │   │   ├── vectors/          # Cálculos de vectores
│   │   │   ├── levels/           # Sistema de niveles
│   │   │   ├── health/           # Corazones, muerte, resurrección
│   │   │   ├── judgement/        # Judgement Night pipeline
│   │   │   ├── economy/          # BTC, wallet, store
│   │   │   ├── scheduler/        # Generación de tareas diarias
│   │   │   ├── state-machines/   # Estados del avatar
│   │   │   ├── validation/       # Cross-cutting validations
│   │   │   ├── types/            # Result<T,E>, branded types
│   │   │   └── utils/            # roundToDecimals, invariants
│   │   ├── supabase/             # client.ts, server.ts, admin.ts, middleware.ts
│   │   ├── stripe/               # client.ts, config.ts
│   │   ├── gemini/               # client.ts, prompt-builder.ts, image-pipeline.ts
│   │   ├── email/                # client.ts (4 funciones de email)
│   │   ├── redis/                # client.ts, rate-limit.ts (3 limiters)
│   │   ├── inngest/              # client.ts, functions/ (3 funciones)
│   │   ├── analytics/            # posthog.ts, events.ts
│   │   ├── constants/            # game.ts (TODAS las constantes del motor)
│   │   ├── validators/           # Zod schemas compartidos
│   │   ├── utils/                # cn(), formatDate(), etc.
│   │   └── env.ts                # Validación Zod de env vars
│   └── types/
│       ├── database.types.ts     # GENERADO por Supabase CLI
│       └── custom.types.ts       # Tipos manuales del proyecto
├── supabase/
│   ├── migrations/               # SQL migrations (ordenadas por timestamp)
│   ├── seed.sql                  # Datos iniciales (store_items)
│   └── config.toml
├── public/
│   ├── avatars/                  # 6 imágenes base de personajes
│   └── logo_MetaMen100.png
└── tests/                        # Tests de integración (si necesario)
```

## 5. CONSTANTES CRÍTICAS DEL MOTOR

```
VECTORES: 6 (AURA, JAWLINE, WEALTH, PHYSIQUE, SOCIAL, ENV)
RANGO VECTORES: 0.00 - 50.00 (ENV: 1-10, derivado del nivel)
TAREAS: 17 categorías → 5 vectores directos
PERSONAJES: 6 (EL_RASTAS, EL_GUARRO, EL_PECAS, EL_GREÑAS, EL_GUERO, EL_LIC)
HERRAMIENTAS: 9 (meditation, focus_timer, lookmaxing, journal, logbook, kegel, posture, metagym, voice)
NIVELES: 1-13 (MVP prácticamente hasta 10)
HEALTH: 10 base, máximo 13
BTC DAILY CAP: 3,500
TRIAL: 5 días
JN HORA: 00:00 medianoche hora local
CALENDARIO: Fijo (7 días hardcodeados, misma distribución cada semana)
DOWN = -UP (simétrico, fijo, sin diminishing returns en DOWN)
UP diminishing: max(0.25, 0.90^(rep-1))
MERCY RULE: ≥80% completación = NO se aplican DOWNs
0% completación = NO se genera imagen (ahorro costos)
3ra muerte = HIBERNACIÓN (JN deja de procesar la cuenta)
ENV = nivel del personaje (nivel 3 → env 3 → fondo "cuarto modesto")
DEATH BTC LOSS: 30% (1ra), 40% (2da), 50% (3ra)
DEATH AURA PRESERVATION: max(0, currentAura × 0.30)
PRECIOS FOUNDERS: $9.99/mes, $29.99/100días, $79.00/año (USD)
```

## 6. WORKFLOW POR TAREA

Todo agente que ejecute una tarea DEBE seguir este proceso:

```
PASO 1 — LEER: Abrir la Caja correspondiente y leer la tarea COMPLETA
PASO 2 — IMPLEMENTAR: Escribir código siguiendo detalle, rutas, firmas, tipos exactos
PASO 3
```
