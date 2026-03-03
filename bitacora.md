# METAMEN100 — BITÁCORA DE PROYECTO

# ══════════════════════════════════════════════════════════════

# Este documento es el ESTADO VIVO del proyecto.

# Todo agente DEBE leerlo al inicio de cada sesión.

# Todo agente DEBE actualizarlo después de cada tarea completada.

# ══════════════════════════════════════════════════════════════

## ESTADO GENERAL

| Campo                   | Valor                                           |
| ----------------------- | ----------------------------------------------- |
| Fase actual             | MVP v1.0                                        |
| Caja en curso           | **CAJA MVP-02: Infraestructura**                |
| Última tarea completada | `02.4.1` — Configurar CI workflow               |
| Próxima tarea           | `02.4.2` — (siguiente en secuencia Caja MVP-02) |
| Bloqueadores            | Ninguno                                         |
| Fecha inicio proyecto   | 2026-02-21                                      |
| Último commit           | `72cc93d` chore(02): add ci workflow — 02.4.1   |
| Branch                  | main                                            |

## MAPA DE PROGRESO

```
CAJA MVP-02: Infraestructura     [███░░░░░░░] 15/96  ← EN CURSO
CAJA MVP-03: Base de Datos       [░░░░░░░░░░] 0/??
CAJA MVP-04: Motor Core          [░░░░░░░░░░] 0/??
CAJA MVP-05: Auth/Onboarding     [░░░░░░░░░░] 0/??
CAJA MVP-06: Dashboard/UI        [░░░░░░░░░░] 0/??
CAJA MVP-07: Arsenal (Arq)       [░░░░░░░░░░] 0/??
CAJA MVP-08: IA Generativa       [░░░░░░░░░░] 0/??
CAJA MVP-10: Stripe/Pagos        [░░░░░░░░░░] 0/??
CAJA MVP-11: Email               [░░░░░░░░░░] 0/??
CAJA MVP-12: Observabilidad      [░░░░░░░░░░] 0/??
CAJA MVP-13: Launch              [░░░░░░░░░░] 0/??
```

## TECH STACK CONFIGURADO

| Servicio      | Status         | Notas                |
| ------------- | -------------- | -------------------- |
| Next.js 15    | ✅ Configurado | 15.5.12 + App Router |
| Supabase      | ⬜ Pendiente   |                      |
| Stripe        | ⬜ Pendiente   |                      |
| Gemini API    | ⬜ Pendiente   |                      |
| Resend        | ⬜ Pendiente   |                      |
| Upstash Redis | ⬜ Pendiente   |                      |
| Inngest       | ⬜ Pendiente   |                      |
| Vercel        | ⬜ Pendiente   |                      |
| Sentry        | ⬜ Pendiente   |                      |
| PostHog       | ⬜ Pendiente   |                      |

## CREDENCIALES OBTENIDAS

| Variable                           | Status |
| ---------------------------------- | ------ |
| NEXT_PUBLIC_SUPABASE_URL           | ⬜     |
| NEXT_PUBLIC_SUPABASE_ANON_KEY      | ⬜     |
| SUPABASE_SERVICE_ROLE_KEY          | ⬜     |
| STRIPE_SECRET_KEY                  | ⬜     |
| STRIPE_WEBHOOK_SECRET              | ⬜     |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | ⬜     |
| STRIPE_PRICE_MONTHLY               | ⬜     |
| STRIPE_PRICE_PROTOCOL              | ⬜     |
| STRIPE_PRICE_ANNUAL                | ⬜     |
| GEMINI_API_KEY                     | ⬜     |
| RESEND_API_KEY                     | ⬜     |
| UPSTASH_REDIS_REST_URL             | ⬜     |
| UPSTASH_REDIS_REST_TOKEN           | ⬜     |
| INNGEST_EVENT_KEY                  | ⬜     |
| INNGEST_SIGNING_KEY                | ⬜     |
| NEXT_PUBLIC_APP_URL                | ⬜     |
| SENTRY_DSN                         | ⬜     |
| NEXT_PUBLIC_POSTHOG_KEY            | ⬜     |

## DECISIONES DE ARQUITECTURA (Referencia rápida)

- **UI agrupada por 5 vectores** (AURA, JAWLINE, WEALTH, PHYSIQUE, SOCIAL) — no 4 arquetipos
- **Calendario semanal FIJO** de 17 tareas hardcodeado
- **ENV es vector derivado** del nivel del personaje (nivel 1 = env 1)
- **JN a las 00:00** hora local, procesado por cron Inngest cada hora
- **Mercy Rule 80%**: ≥80% completion = no DOWNs, no pérdida de hearts
- **0% completion = NO genera imagen** (protege costos Gemini)
- **3ra muerte = hibernación** de la cuenta (JN deja de procesarla)
- **DOWN = -UP simétrico**, fijos (sin diminishing returns)
- **UP tiene diminishing returns**: max(0.25, 0.90^(rep-1))
- **Imagen base estática** pre-generada por personaje (antes del primer JN)
- **Consistency Anchor**: reference image + identity tokens + negative prompt
- **Precios Founders**: $9.99/mes, $29.99/100 días, $79.00/año USD
- **Onboarding**: Quiz 4 pantallas → Selección Avatar (libre) → Juramento → Dashboard
- **Personaje irreversible** una vez seleccionado

---

## REGISTRO DE TAREAS COMPLETADAS

- **Total actual**: 15 tareas completadas (`02.2.7` marcado NO MVP / SKIPPED)

### [02.1.2] — Inicializar proyecto Next.js 15

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-02 19:00
- **Archivos**: .gitignore, eslint.config.mjs, next.config.ts, package.json, pnpm-lock.yaml, pnpm-workspace.yaml, postcss.config.mjs, src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, tsconfig.json, public/\*
- **Test**: N/A (tarea [SETUP])
- **Commit**: `bd26fae`
- **Notas**: Scaffold inicial con Next.js 15 + React 19, Tailwind v4, ESLint flat config, Turbopack en `pnpm dev`.

### [02.1.3] — Configurar package.json completo

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-02 21:00
- **Archivos**: package.json, .npmrc, pnpm-lock.yaml, pnpm-workspace.yaml
- **Test**: N/A (tarea [SETUP])
- **Commit**: `b433092` (feat) + `5c0ee2f` (fix)
- **Notas**: Configuración completa con 17 dependencias MVP y 15 devDependencies. Scripts añadidos: test, test:watch, test:coverage, clean, verify. Correcciones post-auditoría: campo `packages` en pnpm-workspace.yaml y em-dash en descripción.

### [02.1.6] — Configurar Design System COMPLETO en globals.css (Tailwind v4)

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 00:00
- **Archivos**: src/app/globals.css, src/app/layout.tsx, eslint.config.mjs
- **Test**: N/A (tarea [CONFIG])
- **Commit**: `238fead`
- **Notas**: Design system completo con 40+ tokens CSS (fondos, accents, estados, texto, vectores, niveles, rareza). 7 animaciones con @keyframes fuera de @theme. Fuentes Inter + JetBrains Mono via next/font. Corregido eslint.config.mjs (bug pre-existente: flat config intentaba spread de legacy config). postcss.config.mjs ya estaba correcto. Build, lint y typecheck pasan sin errores.

### [02.1.10] — Verificar Turbopack en desarrollo

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 01:30
- **Archivos**: docs/turbopack-verification.md
- **Test**: N/A (tarea [SETUP])
- **Commit**: `34117d3`
- **Notas**: Turbopack APROBADO. Cold start 1354ms (vs Webpack 1711ms, -21%). HMR 90ms (vs Webpack 305ms, -70%). Panic inicial resuelto eliminando archivo `nul` espurio (artefacto de Windows de validación PostCSS anterior). Sin incompatibilidades reales.

### [02.1.11] — Validar design tokens CSS custom properties

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 04:30
- **Archivos**: (sin cambios — globals.css ya cumple al 100%)
- **Test**: N/A (tarea [CONFIG] de validacion)
- **Commit**: PENDIENTE
- **Notas**: Validacion pura. Los 33 tokens de color (3 fondos + 5 accent + 4 semanticos + 4 texto + 12 vectores + 5 niveles + 4 rareza) ya estaban presentes con valores HEX exactos desde tarea 02.1.6. No existe tailwind.config.ts (correcto para v4). pnpm build pasa sin errores.

### [02.2.1] — Configurar ESLint 9 flat config con plugin de seguridad

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 05:00
- **Archivos**: eslint.config.mjs, package.json, pnpm-lock.yaml
- **Test**: N/A (tarea [CONFIG])
- **Commit**: `88af1a7`
- **Notas**: eslint-plugin-security@4.0.0 instalado. Reglas activas: detect-eval-with-expression (error), detect-unsafe-regex (error), detect-non-literal-regexp/require/object-injection/timing-attacks (warn). @typescript-eslint/no-explicit-any en error. Glob patterns validados: **/\*.ts, **/_.tsx, \*\*/_.js, \*_/_.mjs con prefijo recursivo correcto. pnpm lint pasa sin errores. Nota: detect-eval-with-expression detecta eval(variable) no eval("literal") — comportamiento correcto por diseno.

### [02.2.2] — Configurar Prettier con plugin Tailwind

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 05:20
- **Archivos**: .prettierrc, package.json, pnpm-lock.yaml
- **Test**: `pnpm format:check src/`, `pnpm prettier --find-config-path`, test temporal de orden de clases Tailwind
- **Commit**: `239de12`
- **Notas**: Se añadió Prettier + `prettier-plugin-tailwindcss`, scripts `format` y `format:check` en package.json.

### [02.2.3] — Configurar .prettierignore

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 05:40
- **Archivos**: .prettierignore
- **Test**: checks de exclusión sobre `node_modules/**`, `pnpm-lock.yaml` y scope `src/**/*.ts`
- **Commit**: `657d583`
- **Notas**: Exclusiones de build, coverage, lockfile, migraciones y `.inngest/` registradas.

### [02.2.4] — Configurar .editorconfig

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 05:58
- **Archivos**: .editorconfig
- **Test**: validación de propiedades globales + override Markdown + newline final
- **Commit**: `deb6862`
- **Notas**: Estandarizado `indent_size=2`, `end_of_line=lf`, `charset=utf-8`.

### [02.2.5] — Instalar dependencias de linting

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 06:30
- **Archivos**: package.json, pnpm-lock.yaml
- **Test**: verificación Node de deps esperadas/prohibidas + `pnpm lint`
- **Commit**: `caac799`
- **Notas**: Instaladas en devDependencies: `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `eslint-plugin-import-x`.

### [02.2.6] — Configurar eslint-plugin-import-x para orden de imports

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 06:50
- **Archivos**: eslint.config.mjs
- **Test**: prueba funcional de `import-x/order` con archivos temporales
- **Commit**: `820ec3b`
- **Notas**: Se insertó bloque `Import ordering` con resolver `typescript/node`, `pathGroups` internos y reglas `no-duplicates`, `first`, `order`.

### [02.2.7] — Configurar knip

- **Estado**: ⏭️ SKIPPED (NO MVP)
- **Fecha**: 2026-03-03
- **Archivos**: (sin cambios)
- **Test**: N/A
- **Commit**: N/A
- **Notas**: Excluida del alcance MVP por decisión de producto.

### [02.2.8] — Verificar pipeline de linting completo

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 07:20
- **Archivos**: src/app/layout.tsx, src/app/page.tsx, src/app/globals.css
- **Test**: `pnpm lint`, `pnpm eslint "src/**/*.{ts,tsx}"`, `pnpm format:check`, test temporal `security/detect-eval-with-expression`
- **Commit**: `95df28f`
- **Notas**: Se aplicaron correcciones mínimas de lint/formato (sin cambios de lógica). Check 5 documentado como SKIPPED por 02.2.7 NO MVP.

### [02.3.3] — Configurar pre-push hook

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 10:15
- **Archivos**: .husky/pre-push
- **Test**: N/A (tarea [CONFIG])
- **Commit**: PENDIENTE
- **Notas**: Hook pre-push ejecuta `pnpm typecheck && pnpm test -- --passWithNoTests`. Ajuste: `--passWithNoTests` agregado porque no hay tests aun en el proyecto (vitest exit code 1 sin tests). El flag `--run` del prompt se omitio porque el script test ya incluye `vitest run`. Line endings corregidos a LF. typecheck redundante con pre-commit es intencional (defense in depth).

### [02.3.6] — Documentar branch naming convention

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 11:05
- **Archivos**: .github/BRANCH_NAMING.md
- **Test**: N/A (tarea [CONFIG] documentacion)
- **Commit**: PENDIENTE
- **Notas**: Formato {type}/{caja}.{subcaja}/{description}. 11 types alineados con commitlint. 9 cajas (02-10) con nota sobre Caja 01. 6 ejemplos validos, 4 invalidos. 3 tablas Markdown. 6 bloques de codigo con triple backtick.

### [02.4.1] — Configurar CI workflow

- **Estado**: ✅ COMPLETADA
- **Fecha**: 2026-03-03 12:00
- **Archivos**: .github/workflows/ci.yml
- **Test**: N/A (tarea [CONFIG])
- **Commit**: `72cc93d`
- **Notas**: CI con 4 jobs paralelos (lint, type-check, unit-test, build). actions/checkout@v4, pnpm/action-setup@v2 (v9.15.0), actions/setup-node@v4 (node 20, cache pnpm). .next/cache via actions/cache@v4 solo en build job. Concurrency con cancel-in-progress. timeout-minutes: 15 para todos los jobs. Sin env vars dummy. YAML validado con yaml-lint.

---

## ISSUES Y DEUDA TÉCNICA

- **[DEUDA-DEP-001] Normalización de dependencias pendiente**
- **Contexto**: El conteo real del repo no coincide con el conteo objetivo histórico de la caja (`PROD=23`, `DEV=15` vs `24/6` esperado en prompts antiguos).
- **Impacto**: Puede generar falsos negativos en validaciones por conteo fijo, aunque `build` y auditoría crítica pasen.
- **Acción pendiente**: Ejecutar una tarea dedicada de saneamiento de dependencias al cierre de la Caja MVP-02 (inventario, depuración de huérfanas y actualización del criterio de validación por baseline real).

---

## NOTAS DE SESIÓN

- Sin notas de sesión registradas.
