/*
 * PostCSS Configuration - METAMEN100
 *
 * Tailwind CSS v4 uses @tailwindcss/postcss as the only required plugin.
 *
 * DOCUMENTED DECISIONS:
 * - autoprefixer: NOT required. @tailwindcss/postcss uses Lightning CSS
 *   internally, which already includes automatic vendor prefixing.
 * - cssnano: NOT required. Next.js already minifies CSS automatically in
 *   production builds. Adding it would be redundant and may conflict with
 *   Next.js optimization pipeline.
 * - Other plugins: No additional plugins are required for MVP.
 *
 * Ref: https://tailwindcss.com/docs/installation/using-postcss
 */

export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
