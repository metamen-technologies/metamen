# MetaMen100 — AGENTS.md

> Este documento es la referencia obligatoria para agentes de IA que trabajen en el proyecto.  
> Lee este archivo completamente antes de escribir cualquier código.  
> Idioma del código: Inglés. Idioma de documentación y UI: Español mexicano.

---

## 1. Visión General del Proyecto

**MetaMen100** es un Sistema Operativo de Conducta con IA generativa y gamificación. Es una aplicación de auto-mejora masculina donde el usuario completa tareas diarias que afectan el estado de su avatar, el cual evoluciona visualmente según su comportamiento real.

| Aspecto | Descripción |
|---------|-------------|
| **Tipo** | Aplicación web gamificada con avatares IA |
| **Fase actual** | MVP v1.0 — Caja MVP-02: Infraestructura (6/96 tareas completadas) |
| **Fecha inicio** | 2026-02-21 |
| **North Star** | Usuario llega al Día 6 → ve cambio visual impactante → paga suscripción |

### Concepto Central
- **6 Vectores** representan dimensiones del desarrollo personal: AURA, JAWLINE, WEALTH, PHYSIQUE, SOCIAL, ENV
- **17 Tareas** distribuidas en 5 arquetipos afectan estos vectores
- **6 Personajes base**: El Rastas, El Guarro, El Pecas, El Greñas, El Güero, El Lic
- **Judgement Night (JN)**: Proceso diario a las 00:00 que evalúa progreso y genera nueva imagen de avatar
- **Economía BTC**: Moneda interna con límite diario de 2,000 BTC

---

## 2. Tech Stack

### Core
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 15.5.12 | Framework (App Router, Server Actions, Server Components) |
| React | 19.0.0 | UI |
| TypeScript | 5.7.x | Ultra-strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| Tailwind CSS | v4 | Styling (dark mode único, mobile-first) |

### Backend y Servicios
| Servicio | Propósito |
|----------|-----------|
| Supabase | Auth + PostgreSQL + Storage + Realtime |
| Stripe | Pagos (Checkout hosted, Customer Portal, 4 webhooks) |
| Gemini 2.5 Flash | Generación de imágenes de avatar (pixel art) — único proveedor IA |
| Upstash Redis | Rate limiting serverless (8 limiters) |
| Inngest | Background jobs (5 funciones: Judgement Night, image gen, cleanup, wallet reset, degradation) |
| Sentry | Error tracking (tracesSampleRate: 0.3) |
| PostHog | Analytics + feature flags |

### Testing y Calidad
- **Vitest**: Unit testing (threshold 80% coverage)
- **Playwright**: E2E testing
- **ESLint 9**: Flat config con plugin de seguridad
- **Prettier**: Formateo consistente
- **Zod**: Validación de schemas en boundaries

### Package Manager
- **pnpm 9.15.0+** obligatorio
- **Node.js 20 LTS** obligatorio

---

## 3. Estructura de Directorios

```
metamen100/
├── CLAUDE.md                     # Reglas absolutas del proyecto
├── BITACORA.md                   # Estado vivo del proyecto
├── AGENTS.md                     # Este archivo
├── docs/
│   └── cajas/                    # Tareas organizadas por cajas MVP
│       └── caja-mvp-02.md.md     # 96 tareas de infraestructura
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Rutas públicas: login, register, callback
│   │   ├── (dashboard)/          # Rutas protegidas: dashboard, tasks, tools, shop, etc.
│   │   ├── api/                  # API routes (webhooks, inngest, health, cron)
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css           # Design system completo (Tailwind v4)
│   ├── components/               # UI Components (Layer 4)
│   │   ├── ui/                   # Atoms: Button, Card, Input, Badge
│   │   ├── layout/               # Shell, BottomNav, Header
│   │   ├── dashboard/            # AvatarDisplay, VectorHUD, TaskList
│   │   └── onboarding/           # QuizStep, CharacterSelect, Oath
│   ├── lib/
│   │   ├── core/                 # MOTOR DEL JUEGO (100% funciones puras — Layer 1)
│   │   │   ├── vectors/          # Cálculos de 6 vectores
│   │   │   ├── levels/           # Sistema de 12 niveles
│   │   │   ├── health/           # HP (5-14), muerte, resurrección
│   │   │   ├── judgement/        # Judgement Night pipeline
│   │   │   ├── economy/          # BTC, wallet, tienda
│   │   │   ├── state-machines/   # Estados del avatar
│   │   │   ├── validation/       # Cross-cutting validations
│   │   │   ├── types/            # Result<T,E>, branded types
│   │   │   └── utils/            # roundToDecimals, invariants
│   │   ├── server/
│   │   │   └── actions/          # Server Actions (Layer 2 — únicos entry points de mutación)
│   │   ├── supabase/             # client.ts, server.ts, admin.ts, middleware.ts
│   │   ├── stripe/               # client.ts, config.ts
│   │   ├── ai/                   # gemini.ts (NO replicate, NO DALL-E)
│   │   ├── redis/                # client.ts, rate-limit.ts
│   │   ├── inngest/              # client.ts, events.ts, functions/
│   │   └── analytics/            # posthog.ts
│   ├── hooks/                    # Custom hooks ('use client' siempre)
│   ├── stores/                   # Zustand stores
│   ├── types/                    # Database types + custom types (Layer 0)
│   └── workers/                  # Background workers
├── supabase/
│   ├── migrations/               # SQL migrations (13 tablas, 12 ENUMs)
│   ├── seed.sql                  # Datos iniciales
│   └── functions/                # Edge functions
├── tests/                        # Tests organizados por tipo
│   ├── unit/                     # Vitest tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # Playwright tests
├── public/                       # Static assets
│   └── avatars/                  # 6 imágenes base de personajes
└── scripts/                      # Utilidades: seed, reset, verify
```

### Reglas de Organización
- Cada directorio tiene `index.ts` como barrel export
- `src/lib/core/` es **ZONA PROHIBIDA DE I/O** — solo funciones puras
- `src/lib/server/actions/` es el **ÚNICO** lugar donde ocurren mutaciones (DB writes)
- **Server Components por defecto** — solo `'use client'` cuando hay interactividad

---

## 4. Constantes Críticas del Motor

### 6 Vectores
| Vector | Peso | Rango | Color Primario | Color Secundario |
|--------|------|-------|----------------|------------------|
| AURA | 0.20 | 0.00-50.00 | `#9B59B6` | `#E8D5F2` |
| JAWLINE | 0.15 | 0.00-50.00 | `#E74C3C` | `#FADBD8` |
| WEALTH | 0.20 | 0.00-50.00 | `#27AE60` | `#D5F5E3` |
| PHYSIQUE | 0.20 | 0.00-50.00 | `#E67E22` | `#FDEBD0` |
| SOCIAL | 0.15 | 0.00-50.00 | `#3498DB` | `#D6EAF8` |
| ENV | 0.10 | 1-10 | `#1ABC9C` | `#D1F2EB` |

**Fórmula Overall Score**:  
`AURA×0.20 + JAWLINE×0.15 + WEALTH×0.20 + PHYSIQUE×0.20 + SOCIAL×0.15 + (ENV×5)×0.10`

### 12 Niveles
1. INDIGENTE → 2. REFUGIADO → 3. MANTENIDO → 4. ALUCÍN → 5. PEÓN → 6. HOMBRE COMÚN → 7. INFLUYENTE → 8. PUDIENTE → 9. MILLONARIO → 10. MAGNATE → 11. ÉLITE → 12. SEMI-DIOS

- Niveles 1-10: Protocolo principal
- Niveles 11-12: Post-game

### Health Points
- **Inicial**: 5 HP
- **Máximo base**: 10 HP
- **Máximo expandido**: 14 HP (con bonus de niveles 3, 6, 9, 12)
- **Regla**: Día ≥80% completación = +1 HP, Día <80% = -1 HP

### Economía BTC
- **Daily Cap**: 2,000 BTC (NO 3,500)
- **Wallet inicial**: 0 BTC
- **Diminishing returns**: `max(0.25, 0.90^(rep-1))`
- **Streak multiplier**: {0:×1.0, 1-7:×1.1, 8-14:×1.5, 15+:×2.5}

### 6 Personajes
| ID | Key | Título | Tokens IA |
|----|-----|--------|-----------|
| 1 | EL_RASTAS | "El Gamer Olvidado" | brown dreadlocks, thick locks, round face, friendly eyes, warm brown skin |
| 2 | EL_GUARRO | "El Cadenero Caído" | bald, shaved head, square jaw, small eyes, thick neck, tan skin |
| 3 | EL_PECAS | "El Genio Quebrado" | curly red-brown hair, messy, freckles, thin face, sharp features, pale skin with freckles |
| 4 | EL_GREÑAS | "El Rockero Olvidado" | balding with long hair in back, goatee, angular face, deep set eyes, weathered skin |
| 5 | EL_GUERO | "El Galán Pasado" | blonde wavy hair, styled back, strong jaw, blue eyes, handsome, fair skin |
| 6 | EL_LIC | "El Ejecutivo Reemplazado" | black hair, receding hairline, rectangular glasses, stubble, tired eyes, olive skin |

---

## 5. Comandos de Build y Test

```bash
# Desarrollo
pnpm dev              # Inicia con Turbopack (recomendado)
pnpm dev --turbopack  # Explicit Turbopack

# Build
pnpm build            # Build de producción
pnpm start            # Inicia build de producción

# Calidad de código
pnpm lint             # ESLint
pnpm typecheck        # TypeScript --noEmit
pnpm format           # Formatear con Prettier
pnpm format:check     # Verificar formato

# Testing
pnpm test             # Unit tests (Vitest)
pnpm test:watch       # Unit tests modo watch
pnpm test:coverage    # Coverage report (threshold 80%)

# Utilidades
pnpm clean            # Limpiar .next, node_modules
pnpm verify           # Pipeline completo: lint + typecheck + test
```

### Scripts planificados (Cajas futuras)
```bash
pnpm db:start         # Supabase local
pnpm db:stop          # Detener Supabase
pnpm db:types         # Generar tipos de DB
pnpm db:seed          # Seed datos de prueba
pnpm db:reset         # Reset + re-seed

pnpm inngest:dev      # Inngest Dev Server
pnpm env:check        # Validar variables de entorno
pnpm services:verify  # Verificar 7 servicios externos
pnpm test:smoke       # Smoke tests locales
```

---

## 6. Guías de Estilo de Código

### TypeScript — Ultra-Strict
```typescript
// CERO 'any' - Usar unknown + type narrowing
const handleUnknown = (value: unknown): string => {
  if (typeof value === 'string') return value;
  return String(value);
};

// Result<T,E> monad en funciones puras (NO throw)
// src/lib/core/types/result.ts (a implementar)
import { ok, err } from '@/lib/core/types/result';

const calculateVectors = (input: Input): Result<VectorState, Error> => {
  if (!isValid(input)) return err(new Error('Invalid input'));
  return ok(calculatedState);
};
```

### Next.js — Server Components por Defecto
```typescript
// ✅ CORRECTO: Server Component con data fetching
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const { data: profile } = await supabase.from('profiles').select('*').single();
  return <Dashboard profile={profile} />;
}

// ✅ Server Action para mutaciones
// src/lib/server/actions/tasks/index.ts
'use server';

export async function completeTask(taskId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  
  // Validación con Zod PRIMERO
  const parsed = taskIdSchema.safeParse(taskId);
  if (!parsed.success) return { success: false, error: 'Invalid taskId' };
  
  // Mutación...
  revalidatePath('/dashboard');
  return { success: true };
}
```

### Naming Conventions
| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Archivos | kebab-case | `avatar-state.ts` |
| Componentes | PascalCase | `TaskCard.tsx` |
| Funciones | camelCase | `calculateOverallScore` |
| Constantes | UPPER_SNAKE_CASE | `VECTOR_WEIGHTS` |
| Tipos/Interfaces | PascalCase | `VectorState` |
| Enums | PascalCase (valores UPPER_SNAKE) | `VectorName.AURA` |

### Imports — Siempre Alias
```typescript
// ✅ CORRECTO
import { calculateVector } from '@/lib/core/vectors';
import { TaskCard } from '@/components/dashboard';
import type { VectorState } from '@/types';

// ❌ PROHIBIDO
import { calculateVector } from '../../../lib/core/vectors';
```

### Path Aliases (tsconfig.json)
```json
{
  "@/*": ["./src/*"],
  "@/core/*": ["./src/lib/core/*"],
  "@/core": ["./src/lib/core"],
  "@/types/*": ["./src/types/*"],
  "@/types": ["./src/types"],
  "@/components/*": ["./src/components/*"],
  "@/hooks/*": ["./src/hooks/*"],
  "@/actions/*": ["./src/lib/server/actions/*"],
  "@/stores/*": ["./src/stores/*"]
}
```

### Design System — Colores Oficiales
```css
/* Elevación */
--color-bg-base: #0A0A0A        /* Fondo principal */
--color-bg-card: #1A1A1A        /* Superficies */
--color-bg-elevated: #2D2D2D    /* Cards/panels */

/* Accent Dual */
--color-accent-gold: #D4AF37
--color-accent-cta: #FF073A      /* Call-to-action */
--color-accent-active: #00E5FF

/* Semánticos */
--color-error: #FF0000
--color-success: #00FF88
--color-warning: #FFB800
--color-info: #00E5FF
```

---

## 7. Estrategia de Testing

### Unit Tests (Vitest)
- Ubicación: Junto al archivo bajo test (`file.test.ts`) o en `tests/unit/`
- Cobertura mínima: 80%
- Enfoque: Funciones puras en `src/lib/core/`
- NO retry para tests flaky

```typescript
// src/lib/core/vectors/calculations.test.ts
describe('calculateVectorChange', () => {
  it('should return correct UP value for first repetition', () => {
    const result = calculateVectorChange({
      vector: VectorName.AURA,
      taskCategory: TaskCategory.MEDITATION,
      currentLevel: 25,
      repetition: 1,
    });
    expect(result.up).toBe(0.50);
  });
  
  it('should apply diminishing returns after first repetition', () => {
    // max(0.25, 0.90^(rep-1))
  });
});
```

### Integration Tests
- Supabase local con datos de seed
- Verificar funciones PostgreSQL: `fn_complete_task_transaction`, `fn_process_judgement_night`

### E2E Tests (Playwright)
- Flujos críticos: registro → onboarding → completar tarea → ver vectores

---

## 8. Convenciones de Commits

**Conventional Commits obligatorio**:
```
tipo(ID_TAREA): descripción breve

ejemplos:
feat(02.1.1): init next.js 15 project with app router
test(04.1.2): add vector calculation unit tests
refactor(core): extract common validation logic
```

Tipos permitidos: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`, `build`, `ci`

Scopes permitidos:  
`auth`, `avatar`, `tasks`, `vectors`, `economy`, `ui`, `db`, `api`, `aura`, `jawline`, `wealth`, `physique`, `social`, `env`, `tools`, `inngest`, `payments`, `images`, `notifications`, `store`, `levels`, `health`, `redis`, `stripe`, `gemini`, `posthog`, `sentry`, `supabase`

---

## 9. Seguridad

### Variables de Entorno (17 variables)
| Variable | Tipo | Servicio |
|----------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase |
| `STRIPE_SECRET_KEY` | Server | Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Server | Stripe |
| `GEMINI_API_KEY` | Server | Gemini |
| `UPSTASH_REDIS_REST_URL` | Server | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Upstash |
| `INNGEST_EVENT_KEY` | Server | Inngest |
| `INNGEST_SIGNING_KEY` | Server | Inngest |
| `SENTRY_DSN` | Server | Sentry |
| `NEXT_PUBLIC_POSTHOG_KEY` | Client | PostHog |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client | PostHog |
| `NEXT_PUBLIC_APP_URL` | Client | App |

### Rate Limits
| Endpoint | Límite | Key |
|----------|--------|-----|
| Login | 5/hora | IP+email |
| Register | 3/hora | IP |
| Password Reset | 3/hora | IP+email |
| Complete Task | 50/hora | user_id |
| Read Tasks | 100/min | user_id |
| Store Purchase | 10/min | user_id |

### CSP y Headers de Seguridad (next.config.ts)
- CSP completo configurado
- HSTS: 2 años
- X-Frame-Options: DENY
- Permissions-Policy: sin camera/microphone

---

## 10. Proceso de Desarrollo

### Workflow por Tarea

```
PASO 1 — LEER: Abrir la Caja correspondiente y leer la tarea COMPLETA
PASO 2 — IMPLEMENTAR: Escribir código siguiendo detalle, rutas, firmas, tipos exactos
PASO 3 — VALIDAR: Ejecutar el criterio de validación descrito en la columna "Validación"
PASO 4 — TEST: Si la tarea es [LOGIC] o [TYPESCRIPT] con lógica, crear/actualizar test
PASO 5 — LINT: Ejecutar `pnpm lint && pnpm typecheck`
PASO 6 — COMMIT: `git add -A && git commit -m "tipo(ID): descripción"`
PASO 7 — BITÁCORA: Agregar entrada en BITACORA.md
PASO 8 — PUSH: `git push origin main`
```

### Archivos de Referencia Obligatorios
1. **CLAUDE.md** — Reglas absolutas y workflow
2. **BITACORA.md** — Estado actual y progreso
3. **docs/cajas/caja-mvp-02.md.md** — Tareas de infraestructura (96 tareas)

### Errores Comunes — PROHIBIDOS
| Error | Corrección |
|-------|------------|
| Usar `any` | Usar `unknown` + type guard |
| `useEffect` para fetch | Usar Server Component con `async` |
| API route para CRUD | Usar Server Action en `src/lib/server/actions/` |
| Import circular en `lib/core` | Respetar capas: Layer N solo importa ≤ N-1 |
| `throw` en función pura | Retornar `err()` con Result monad |
| Generar imagen con 0% completion | Verificar `completion > 0` antes de encolar |
| Commit sin ID de tarea | Formato: `feat(02.1.1): descripción` |
| Olvidar actualizar BITACORA.md | SIEMPRE actualizar después de cada tarea |

---

## 11. Estado Actual del Proyecto

### Última tarea completada: `02.2.1`
- ESLint 9 flat config con plugin de seguridad
- Commit: `8b22a8a`

### Tech Stack Configurado
| Servicio | Status |
|----------|--------|
| Next.js 15 | ✅ Configurado (15.5.12 + App Router + Turbopack) |
| TypeScript | ✅ Ultra-strict configurado |
| Tailwind CSS v4 | ✅ Design system completo implementado |
| ESLint 9 | ✅ Flat config + security plugin |
| Prettier | ✅ Configurado con plugin Tailwind |
| Supabase | ⬜ Pendiente |
| Stripe | ⬜ Pendiente |
| Gemini API | ⬜ Pendiente |
| Upstash Redis | ⬜ Pendiente |
| Inngest | ⬜ Pendiente |
| Sentry | ⬜ Pendiente |
| PostHog | ⬜ Pendiente |

### Estructura de carpetas: ✅ Creada
Todas las carpetas base están creadas con `.gitkeep` donde es necesario. Los barrel exports (`index.ts`) están configurados en cada directorio principal.

---

## 12. Notas para Agentes

1. **Este proyecto está en fase inicial**. La CAJA MVP-02 (Infraestructura) tiene 96 tareas y es el foco actual.

2. **Las decisiones de arquitectura están documentadas** en CLAUDE.md y deben seguirse estrictamente.

3. **El motor del juego (`src/lib/core/`) es sagrado**:
   - 100% funciones puras
   - Sin I/O, sin DB, sin fetch, sin side effects
   - Usar `Result<T,E>` monad, nunca `throw`

4. **Los colores de los 6 vectores son específicos**. NO usar valores diferentes.

5. **Upstash Redis se mantiene** a pesar de que Constantes Maestras §3 indica "Sin Redis" — es una decisión explícita del propietario para rate limiting serverless.

6. **Resend está post-MVP**. Para MVP se usa Supabase Auth nativo para emails.

7. **NO usar**: Replicate, DALL-E, Fal.ai, MongoDB, Firebase, tRPC, Prisma, Python.

8. **Daily BTC Cap es 2,000** (no 3,500 como aparecía en versiones anteriores).

9. **Health máximo es 14** (no 13) — 10 base + 4 bonus.

10. **12 niveles** (10 protocolo + 2 post-game), no 10.

---

*Documento actualizado: 2026-03-03*  
*Basado en exploración real del codebase*
