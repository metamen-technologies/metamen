// postcss.config.mjs
// Tailwind CSS v4 — único plugin requerido: @tailwindcss/postcss
// NO incluir autoprefixer (ya integrado en @tailwindcss/postcss).
// NO incluir cssnano (redundante con Next.js + Tailwind v4 minification).
// Type: import('postcss-load-config').Config

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
