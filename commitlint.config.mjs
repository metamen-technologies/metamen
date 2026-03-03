// commitlint.config.mjs
// Configuración de commitlint para METAMEN100
// Tipos: Conventional Commits
// Scopes: Cajas (02-10) + Dominios de Constantes Maestras v2.0.0
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // --- Tipos ---
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // --- Scopes ---
    'scope-enum': [
      2,
      'always',
      [
        // Caja scopes (numero de caja)
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        '09',
        '10',

        // Domain scopes (Constantes Maestras v2.0.0)
        'auth',
        'avatar',
        'tasks',
        'vectors',
        'economy',
        'ui',
        'db',
        'api',
        'aura',
        'jawline',
        'wealth',
        'physique',
        'social',
        'env',
        'tools',
        'inngest',
        'payments',
        'images',
        'notifications',
        'store',
        'levels',
        'health',
        'redis',
        'stripe',
        'gemini',
        'posthog',
        'sentry',
        'supabase',
      ],
    ],
    // Scope es OPCIONAL: nivel 0 = disabled (no falla si no hay scope)
    'scope-empty': [0],
    'scope-case': [2, 'always', 'lower-case'],

    // --- Subject ---
    'subject-empty': [2, 'never'],
    'subject-case': [2, 'always', ['lower-case', 'sentence-case']],

    // --- Header ---
    'header-max-length': [2, 'always', 100],
  },
};
