#!/usr/bin/env bash
set -euo pipefail

PASS_COUNT=0
FAIL_COUNT=0
TOTAL=9
DEV_PID=""
BUILD_OUTPUT=""
BUILD_EXIT=0

# Cleanup en caso de error o interrupcion
cleanup() {
  if [ -n "${DEV_PID}" ] && kill -0 "${DEV_PID}" 2>/dev/null; then
    kill "${DEV_PID}" 2>/dev/null || true
    wait "${DEV_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

pass_check() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "[PASS] $1/$TOTAL — $2"
}

fail_check() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo "[FAIL] $1/$TOTAL — $2"
  if [ -n "${3:-}" ]; then
    echo "$3"
  fi
}

parse_tsconfig_node_script='
const fs = require("fs");
const tsCompiler = require("typescript");
const raw = fs.readFileSync("tsconfig.json", "utf8");
const parsed = tsCompiler.parseConfigFileTextToJson("tsconfig.json", raw);
if (parsed.error) {
  const msg = tsCompiler.flattenDiagnosticMessageText(parsed.error.messageText, "\n");
  console.log("TSCONFIG_PARSE_ERROR: " + msg);
  process.exit(1);
}
const ts = parsed.config;
'

echo "================================================"
echo "METAMEN100 — Setup Verification v2.0.0"
echo "================================================"

# CHECK 1: pnpm dev arranca
pnpm dev > /dev/null 2>&1 &
DEV_PID=$!
DEV_PASS=false
for i in $(seq 1 8); do
  sleep 2
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
  if [[ "${HTTP_CODE}" =~ ^[23] ]]; then
    DEV_PASS=true
    break
  fi
done
kill "${DEV_PID}" 2>/dev/null || true
wait "${DEV_PID}" 2>/dev/null || true
DEV_PID=""

if [ "${DEV_PASS}" = true ]; then
  pass_check 1 "Dev server arranca correctamente"
else
  fail_check 1 "Dev server no respondio 2xx/3xx en 16s"
fi

# CHECK 2: pnpm build completa (ejecutar solo una vez)
set +e
BUILD_OUTPUT=$(pnpm build 2>&1)
BUILD_EXIT=$?
set -e

if [ "${BUILD_EXIT}" -eq 0 ]; then
  pass_check 2 "Build completa sin errores"
else
  fail_check 2 "Build falla (exit ${BUILD_EXIT})" "$(echo "${BUILD_OUTPUT}" | tail -n 20)"
fi

# CHECK 3: pnpm exec tsc --noEmit pasa
set +e
TSC_OUTPUT=$(pnpm exec tsc --noEmit 2>&1)
TSC_EXIT=$?
set -e

if [ "${TSC_EXIT}" -eq 0 ]; then
  pass_check 3 "TypeCheck: tsc --noEmit pasa"
else
  fail_check 3 "TypeCheck: tsc --noEmit falla" "${TSC_OUTPUT}"
fi

# CHECK 4: TypeScript strict activo (6/6 flags)
set +e
STRICT_OUTPUT=$(node -e "
${parse_tsconfig_node_script}
const co = ts.compilerOptions || {};
const flags = [
  'strict',
  'noUncheckedIndexedAccess',
  'exactOptionalPropertyTypes',
  'noImplicitReturns',
  'noFallthroughCasesInSwitch',
  'forceConsistentCasingInFileNames'
];
const missing = flags.filter((f) => co[f] !== true);
if (missing.length > 0) {
  console.log('MISSING: ' + missing.join(', '));
  process.exit(1);
}
console.log('6/6 flags present');
" 2>&1)
STRICT_EXIT=$?
set -e

if [ "${STRICT_EXIT}" -eq 0 ]; then
  pass_check 4 "TypeScript strict: 6/6 flags presentes"
else
  fail_check 4 "TypeScript strict incompleto" "${STRICT_OUTPUT}"
fi

# CHECK 5: Tailwind funcional con design tokens completos
TOKENS=(
  --color-vector-aura --color-vector-aura-secondary
  --color-vector-jawline --color-vector-jawline-secondary
  --color-vector-wealth --color-vector-wealth-secondary
  --color-vector-physique --color-vector-physique-secondary
  --color-vector-social --color-vector-social-secondary
  --color-vector-env --color-vector-env-secondary
  --color-level-low --color-level-mid --color-level-high --color-level-elite --color-level-god
  --color-rarity-common --color-rarity-rare --color-rarity-epic --color-rarity-legendary
  --color-bg-base --color-bg-card --color-bg-elevated
  --color-accent-gold --color-accent-cta --color-accent-active
  --color-error --color-success --color-warning --color-info
)

FOUND_TOKENS=0
MISSING_TOKENS=()
for token in "${TOKENS[@]}"; do
  if grep -q -- "${token}" src/app/globals.css; then
    FOUND_TOKENS=$((FOUND_TOKENS + 1))
  else
    MISSING_TOKENS+=("${token}")
  fi
done

TAILWIND_CONFIG_MISSING=true
if [ -f tailwind.config.ts ]; then
  TAILWIND_CONFIG_MISSING=false
fi

POSTCSS_PRESENT=true
if [ ! -f postcss.config.mjs ]; then
  POSTCSS_PRESENT=false
fi

if [ "${#MISSING_TOKENS[@]}" -eq 0 ] && [ "${TAILWIND_CONFIG_MISSING}" = true ] && [ "${POSTCSS_PRESENT}" = true ]; then
  pass_check 5 "Tailwind tokens OK (${FOUND_TOKENS}/31), sin tailwind.config.ts y con postcss.config.mjs"
else
  detail=""
  if [ "${#MISSING_TOKENS[@]}" -gt 0 ]; then
    detail="${detail}Missing tokens: ${MISSING_TOKENS[*]}\n"
  fi
  if [ "${TAILWIND_CONFIG_MISSING}" = false ]; then
    detail="${detail}tailwind.config.ts existe (no permitido en v4)\n"
  fi
  if [ "${POSTCSS_PRESENT}" = false ]; then
    detail="${detail}postcss.config.mjs no existe\n"
  fi
  fail_check 5 "Tailwind/token checks fallaron" "$(echo -e "${detail}")"
fi

# CHECK 6: Security headers presentes
HEADERS=(
  "Content-Security-Policy"
  "X-Frame-Options"
  "X-Content-Type-Options"
  "Strict-Transport-Security"
  "Permissions-Policy"
  "Referrer-Policy"
)

MISSING_HEADERS=()
for header in "${HEADERS[@]}"; do
  if ! grep -q "${header}" next.config.ts; then
    MISSING_HEADERS+=("${header}")
  fi
done

if [ "${#MISSING_HEADERS[@]}" -eq 0 ]; then
  pass_check 6 "Security headers presentes (6/6)"
else
  fail_check 6 "Faltan security headers" "Missing: ${MISSING_HEADERS[*]}"
fi

# CHECK 7: Bundle < 200KB (reusar BUILD_OUTPUT del check 2)
if [ "${BUILD_EXIT}" -ne 0 ]; then
  fail_check 7 "Bundle check: Build failed, cannot measure bundle"
else
  SIZE_BYTES=""
  FIRST_LOAD_LINE=$(echo "${BUILD_OUTPUT}" | grep -m1 "First Load JS shared by all" || true)

  if [ -n "${FIRST_LOAD_LINE}" ]; then
    SIZE_FRAGMENT=$(echo "${FIRST_LOAD_LINE}" | grep -oE '[0-9]+([.][0-9]+)?[[:space:]]*(kB|MB|B)' | head -n1 || true)
    if [ -n "${SIZE_FRAGMENT}" ]; then
      SIZE_NUM=$(echo "${SIZE_FRAGMENT}" | grep -oE '^[0-9]+([.][0-9]+)?')
      SIZE_UNIT=$(echo "${SIZE_FRAGMENT}" | grep -oE '(kB|MB|B)$')
      SIZE_BYTES=$(awk -v n="${SIZE_NUM}" -v u="${SIZE_UNIT}" 'BEGIN {
        if (u == "kB") printf "%.0f", n * 1000;
        else if (u == "MB") printf "%.0f", n * 1000000;
        else printf "%.0f", n;
      }')
    fi
  fi

  if [ -z "${SIZE_BYTES}" ]; then
    if [ -d .next/static/chunks ]; then
      SIZE_BYTES=$(find .next/static/chunks -name "*.js" -exec du -cb {} + 2>/dev/null | tail -1 | cut -f1 || true)
      if [ -z "${SIZE_BYTES}" ] || ! [[ "${SIZE_BYTES}" =~ ^[0-9]+$ ]]; then
        SIZE_BYTES=$(find .next/static/chunks -name "*.js" -exec wc -c {} + 2>/dev/null | tail -1 | awk "{print \$1}" || true)
      fi
    fi
  fi

  if [ -z "${SIZE_BYTES}" ] || ! [[ "${SIZE_BYTES}" =~ ^[0-9]+$ ]]; then
    fail_check 7 "Bundle check: no se pudo calcular el tamano"
  elif [ "${SIZE_BYTES}" -lt 200000 ]; then
    pass_check 7 "Bundle < 200KB (${SIZE_BYTES} bytes)"
  else
    fail_check 7 "Bundle >= 200KB (${SIZE_BYTES} bytes)"
  fi
fi

# CHECK 8: Aliases resuelven
set +e
ALIASES_OUTPUT=$(node -e "
${parse_tsconfig_node_script}
const paths = (ts.compilerOptions && ts.compilerOptions.paths) || {};
const expected = {
  '@/*': './src/*',
  '@/core/*': './src/lib/core/*',
  '@/core': './src/lib/core',
  '@/types/*': './src/types/*',
  '@/types': './src/types',
  '@/components/*': './src/components/*',
  '@/hooks/*': './src/hooks/*',
  '@/actions/*': './src/lib/server/actions/*',
  '@/stores/*': './src/stores/*'
};
const missing = [];
for (const [key, value] of Object.entries(expected)) {
  const arr = paths[key];
  if (!Array.isArray(arr) || arr[0] !== value) {
    missing.push(key + ' -> ' + (Array.isArray(arr) ? arr[0] : 'MISSING'));
  }
}
if (missing.length > 0) {
  console.log('ALIASES_MISMATCH: ' + missing.join(', '));
  process.exit(1);
}
console.log('ALIASES_OK 9/9');
" 2>&1)
ALIASES_EXIT=$?
set -e

DIRS=(src/lib/core src/types src/components src/hooks src/stores)
MISSING_DIRS=()
for d in "${DIRS[@]}"; do
  if [ ! -d "${d}" ]; then
    MISSING_DIRS+=("${d}")
  fi
done

if [ "${ALIASES_EXIT}" -eq 0 ] && [ "${#MISSING_DIRS[@]}" -eq 0 ]; then
  pass_check 8 "Aliases y directorios destino OK"
else
  detail=""
  if [ "${ALIASES_EXIT}" -ne 0 ]; then
    detail="${detail}${ALIASES_OUTPUT}\n"
  fi
  if [ "${#MISSING_DIRS[@]}" -gt 0 ]; then
    detail="${detail}Missing dirs: ${MISSING_DIRS[*]}\n"
  fi
  fail_check 8 "Aliases/directorios invalidos" "$(echo -e "${detail}")"
fi

# CHECK 9: CSS custom properties y animaciones definidas
HAS_THEME=true
if ! grep -q "@theme {" src/app/globals.css; then
  HAS_THEME=false
fi

KEYFRAMES=(level-up vector-pulse bitcoin-collect streak-fire death-fade shimmer glow)
MISSING_KEYFRAMES=()
for kf in "${KEYFRAMES[@]}"; do
  if ! grep -q "@keyframes ${kf}" src/app/globals.css; then
    MISSING_KEYFRAMES+=("${kf}")
  fi
done

BODY_BLOCK=$(awk '
  /^body[[:space:]]*\{/ { in_body=1; print; next }
  in_body { print; if ($0 ~ /^\}/) exit }
' src/app/globals.css)

HAS_BODY_BG=true
if ! echo "${BODY_BLOCK}" | grep -q "background-color"; then
  HAS_BODY_BG=false
fi

HAS_BODY_COLOR=true
if ! echo "${BODY_BLOCK}" | grep -q "color:"; then
  HAS_BODY_COLOR=false
fi

HAS_REDUCED_MOTION=true
if ! grep -q "prefers-reduced-motion" src/app/globals.css; then
  HAS_REDUCED_MOTION=false
fi

if [ "${HAS_THEME}" = true ] &&
   [ "${#MISSING_KEYFRAMES[@]}" -eq 0 ] &&
   [ "${HAS_BODY_BG}" = true ] &&
   [ "${HAS_BODY_COLOR}" = true ] &&
   [ "${HAS_REDUCED_MOTION}" = true ]; then
  pass_check 9 "CSS structure OK (@theme, 7 keyframes, body styles, reduced motion)"
else
  detail=""
  if [ "${HAS_THEME}" = false ]; then
    detail="${detail}Missing @theme block\n"
  fi
  if [ "${#MISSING_KEYFRAMES[@]}" -gt 0 ]; then
    detail="${detail}Missing keyframes: ${MISSING_KEYFRAMES[*]}\n"
  fi
  if [ "${HAS_BODY_BG}" = false ] || [ "${HAS_BODY_COLOR}" = false ]; then
    detail="${detail}body block missing background-color or color\n"
  fi
  if [ "${HAS_REDUCED_MOTION}" = false ]; then
    detail="${detail}Missing prefers-reduced-motion media query\n"
  fi
  fail_check 9 "CSS structure check fallo" "$(echo -e "${detail}")"
fi

echo "================================================"
echo "RESULTADO: ${PASS_COUNT}/${TOTAL} checks pasaron"
if [ "${FAIL_COUNT}" -eq 0 ]; then
  echo "STATUS: PASS (9/9)"
  echo "================================================"
  exit 0
else
  echo "STATUS: FAIL (se requieren 9/9)"
  echo "================================================"
  exit 1
fi
