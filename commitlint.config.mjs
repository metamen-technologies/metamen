// commitlint.config.mjs
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Types permitidos por el proyecto METAMEN100
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
    // Scopes: caja numbers (02-10) + domain scopes de Constantes Maestras v2.0.0
    'scope-enum': [
      2,
      'always',
      [
        // Caja numbers (estructura del proyecto)
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
    // Scope es OPCIONAL — permite commits sin scope como "chore: update deps"
    'scope-empty': [0],
    // Body max line length desactivado para mensajes descriptivos
    'body-max-line-length': [0],
    // Footer max line length desactivado
    'footer-max-line-length': [0],
  },
};
