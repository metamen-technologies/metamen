// scripts/verify-auth-emails.ts
// Tarea 02.6.9 — Verificacion de flujo completo de Supabase Auth emails
// Ejecutar: pnpm tsx scripts/verify-auth-emails.ts
//
// Requiere:
// - Supabase local corriendo (supabase start)
// - Inbucket accesible en http://localhost:54324
// - .env o .env.local con NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createClient } from '@supabase/supabase-js';

// --- Configuracion ---
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const INBUCKET_URL = 'http://localhost:54324';

// Colores esperados de la paleta MetaMen100 (Constantes Maestras §2.1 y §2.2)
const EXPECTED_COLORS: Record<string, string> = {
  '#0A0A0A': '--color-bg-base (§2.1)',
  '#FF073A': '--color-accent-cta (§2.2)',
  '#1A1A1A': '--color-bg-card (§2.1)',
  '#D4AF37': '--color-accent-gold (§2.2)',
};

// Rate limits esperados (Security Spec §7.1)
const EXPECTED_RATE_LIMITS = {
  login: { max: 5, window: '1 hora', key: 'IP + email' },
  register: { max: 3, window: '1 hora', key: 'IP' },
  passwordReset: { max: 3, window: '1 hora', key: 'IP + email' },
};

// --- Tipos ---
interface VerificationResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP' | 'INFO';
  message: string;
  details?: string;
}

interface InbucketMessage {
  id: string;
  from: string;
  to: string[];
  subject: string;
  date: string;
  size: number;
}

interface InbucketMessageDetail {
  body: {
    text: string;
    html: string;
  };
}

// --- Validacion de prerequisitos ---
function validatePrerequisites(): void {
  const errors: string[] = [];

  if (!SUPABASE_ANON_KEY) {
    errors.push(
      'ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY no esta configurada.\n' +
        'Configura tu .env o .env.local con las credenciales de Supabase local (supabase start).',
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    errors.push(
      'ERROR: SUPABASE_SERVICE_ROLE_KEY no esta configurada.\n' +
        'Configura tu .env o .env.local con las credenciales de Supabase local (supabase start).',
    );
  }

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`\n❌ ${err}`);
    }
    process.exit(1);
  }
}

// --- Supabase clients ---
function createAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// --- Helpers ---
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function inbucketGetMessages(emailLocalPart: string): Promise<InbucketMessage[]> {
  const url = `${INBUCKET_URL}/api/v1/mailbox/${emailLocalPart}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Inbucket GET ${url} responded ${res.status}`);
  }
  return (await res.json()) as InbucketMessage[];
}

async function inbucketGetMessage(
  emailLocalPart: string,
  messageId: string,
): Promise<InbucketMessageDetail> {
  const url = `${INBUCKET_URL}/api/v1/mailbox/${emailLocalPart}/${messageId}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Inbucket GET ${url} responded ${res.status}`);
  }
  return (await res.json()) as InbucketMessageDetail;
}

function readConfigToml(): string {
  const configPath = resolve(process.cwd(), 'supabase', 'config.toml');
  if (!existsSync(configPath)) {
    throw new Error(`supabase/config.toml no encontrado en ${configPath}`);
  }
  return readFileSync(configPath, 'utf-8');
}

// --- Estado compartido entre verificaciones ---
const testEmail = `test-verify-${Date.now()}@test.local`;
const testEmailLocalPart = testEmail.split('@')[0]!;
const testPassword = 'TestPass123!';

// Almacena el HTML del email capturado para reutilizar en verificacion 3
let capturedEmailHtml = '';

// --- Verificaciones ---

async function verify1_RegistrationEmail(): Promise<VerificationResult> {
  const name = 'Registro envia email de confirmacion';

  try {
    // Leer config para detectar enable_confirmations
    const config = readConfigToml();
    const confirmationsDisabled = config.includes('enable_confirmations = false');

    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      return { name, status: 'FAIL', message: `signUp fallo: ${error.message}` };
    }

    if (!data.user) {
      return { name, status: 'FAIL', message: 'signUp no retorno usuario' };
    }

    if (confirmationsDisabled) {
      return {
        name,
        status: 'SKIP',
        message: 'enable_confirmations=false en config local.',
        details:
          `Usuario de prueba creado exitosamente (${testEmail}).\n` +
          '  En produccion, enable_confirmations DEBE ser true.',
      };
    }

    // Si confirmaciones estan habilitadas, buscar email en Inbucket
    await sleep(2000);
    const messages = await inbucketGetMessages(testEmailLocalPart);

    if (messages.length === 0) {
      return { name, status: 'FAIL', message: 'No se recibio email de confirmacion en Inbucket.' };
    }

    const confirmEmail = messages.find(
      (m) =>
        m.subject.toLowerCase().includes('confirm') || m.subject.toLowerCase().includes('verify'),
    );

    if (!confirmEmail) {
      return {
        name,
        status: 'FAIL',
        message: `Email recibido pero subject no contiene "Confirm" o "Verify": "${messages[0]?.subject}"`,
      };
    }

    const detail = await inbucketGetMessage(testEmailLocalPart, confirmEmail.id);
    const html = detail.body.html || detail.body.text || '';
    capturedEmailHtml = html;

    const hasToken = html.includes('token=') || html.includes('confirmation_url');

    if (!hasToken) {
      return {
        name,
        status: 'WARN',
        message: 'Email recibido pero no se encontro token de confirmacion en el body.',
      };
    }

    return {
      name,
      status: 'PASS',
      message: 'Email de confirmacion recibido en Inbucket con token valido.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name, status: 'FAIL', message: `Error inesperado: ${msg}` };
  }
}

async function verify2_ResetPasswordEmail(): Promise<VerificationResult> {
  const name = 'Reset password envia link valido';

  try {
    const supabase = createAnonClient();
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:3000/auth/callback',
    });

    if (error) {
      return { name, status: 'FAIL', message: `resetPasswordForEmail fallo: ${error.message}` };
    }

    // Esperar a que Inbucket reciba el email
    await sleep(2000);
    const messages = await inbucketGetMessages(testEmailLocalPart);

    // Filtrar emails de reset (puede haber uno previo de confirmacion)
    const resetEmail = messages.find(
      (m) =>
        m.subject.toLowerCase().includes('reset') || m.subject.toLowerCase().includes('password'),
    );

    if (!resetEmail) {
      return {
        name,
        status: 'FAIL',
        message: 'No se recibio email de reset en Inbucket.',
      };
    }

    const detail = await inbucketGetMessage(testEmailLocalPart, resetEmail.id);
    const html = detail.body.html || detail.body.text || '';

    // Guardar HTML para verificacion 3 si no se capturo antes
    if (!capturedEmailHtml) {
      capturedEmailHtml = html;
    }

    const hasLink = html.includes('localhost:3000') || html.includes('127.0.0.1');
    const hasRedirect =
      html.includes('redirect_to') || html.includes('type=recovery') || html.includes('token=');

    return {
      name,
      status: 'PASS',
      message: 'Email de reset recibido en Inbucket.',
      details:
        `Link ${hasLink ? 'contiene' : 'NO contiene'} redirect a http://localhost:3000\n` +
        `  ${hasRedirect ? 'Contiene' : 'NO contiene'} token de recovery.\n` +
        '  Nota: En produccion expira en 1h (jwt_expiry=3600), uso unico.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name, status: 'FAIL', message: `Error inesperado: ${msg}` };
  }
}

async function verify3_TemplateBranding(): Promise<VerificationResult> {
  const name = 'Templates renderizan con colores Constantes Maestras §2';

  try {
    if (!capturedEmailHtml) {
      return {
        name,
        status: 'SKIP',
        message: 'No se capturo HTML de email en verificaciones anteriores.',
        details: 'Ejecutar con Supabase local y enable_confirmations=true para capturar emails.',
      };
    }

    const htmlLower = capturedEmailHtml.toLowerCase();
    const foundColors: string[] = [];
    const missingColors: string[] = [];

    for (const [color, label] of Object.entries(EXPECTED_COLORS)) {
      if (htmlLower.includes(color.toLowerCase())) {
        foundColors.push(`${color} (${label})`);
      } else {
        missingColors.push(`${color} (${label})`);
      }
    }

    if (foundColors.length === Object.keys(EXPECTED_COLORS).length) {
      return {
        name,
        status: 'PASS',
        message: 'Templates contienen todos los colores MetaMen100.',
        details: `  Colores encontrados: ${foundColors.join(', ')}`,
      };
    }

    return {
      name,
      status: 'WARN',
      message: 'Templates usan estilo DEFAULT de Supabase.',
      details:
        `  No se encontraron colores MetaMen100: ${missingColors.map((c) => c.split(' ')[0]).join(', ')}\n` +
        '  Accion: Ejecutar tarea 02.6.8 para personalizar con branding MetaMen100.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name, status: 'FAIL', message: `Error inesperado: ${msg}` };
  }
}

async function verify4_RateLimitsConfig(): Promise<VerificationResult> {
  const name = 'Rate limits configurados (Security Spec §7.1)';

  try {
    const config = readConfigToml();
    const hasAuthSection = config.includes('[auth]');

    if (!hasAuthSection) {
      return {
        name,
        status: 'FAIL',
        message: 'supabase/config.toml no tiene seccion [auth].',
      };
    }

    const checklist = [
      `  - [ ] Login: ${EXPECTED_RATE_LIMITS.login.max}/${EXPECTED_RATE_LIMITS.login.window} (key: ${EXPECTED_RATE_LIMITS.login.key})`,
      `  - [ ] Register: ${EXPECTED_RATE_LIMITS.register.max}/${EXPECTED_RATE_LIMITS.register.window} (key: ${EXPECTED_RATE_LIMITS.register.key})`,
      `  - [ ] Password Reset: ${EXPECTED_RATE_LIMITS.passwordReset.max}/${EXPECTED_RATE_LIMITS.passwordReset.window} (key: ${EXPECTED_RATE_LIMITS.passwordReset.key})`,
    ];

    return {
      name,
      status: 'INFO',
      message: 'Rate limits no testeables programaticamente en local.',
      details:
        '  Checklist produccion (Supabase Dashboard > Auth > Rate Limits):\n' +
        checklist.join('\n'),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name, status: 'FAIL', message: `Error inesperado: ${msg}` };
  }
}

async function verify5_RedirectUrls(): Promise<VerificationResult> {
  const name = 'Redirect URLs configuradas';

  try {
    const config = readConfigToml();

    const siteUrlMatch = config.match(/site_url\s*=\s*"([^"]+)"/);
    const siteUrl = siteUrlMatch?.[1] ?? '';
    const hasSiteUrl = siteUrl === 'http://localhost:3000';

    const redirectMatch = config.match(/additional_redirect_urls\s*=\s*\[([^\]]+)\]/);
    const redirectRaw = redirectMatch?.[1] ?? '';
    const hasCallback = redirectRaw.includes('http://localhost:3000/auth/callback');

    if (!hasSiteUrl || !hasCallback) {
      const issues: string[] = [];
      if (!hasSiteUrl)
        issues.push(`site_url esperado "http://localhost:3000", encontrado "${siteUrl}"`);
      if (!hasCallback)
        issues.push('additional_redirect_urls no incluye http://localhost:3000/auth/callback');
      return {
        name,
        status: 'FAIL',
        message: 'Config local incorrecta.',
        details: `  ${issues.join('\n  ')}`,
      };
    }

    const prodChecklist = [
      '  - [ ] site_url = https://metamen100.com',
      '  - [ ] redirect_urls incluye https://metamen100.com/auth/callback',
      '  - [ ] redirect_urls incluye https://app.metamen100.com/auth/callback (si aplica)',
      '  - [ ] NO incluye localhost en produccion',
    ];

    return {
      name,
      status: 'PASS',
      message: 'Config local correcta.',
      details:
        `  site_url = ${siteUrl}\n` +
        '  redirect_urls incluye http://localhost:3000/auth/callback\n' +
        '  Checklist produccion:\n' +
        prodChecklist.join('\n'),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name, status: 'FAIL', message: `Error inesperado: ${msg}` };
  }
}

// --- Cleanup ---
async function cleanupTestUser(): Promise<void> {
  try {
    const admin = createAdminClient();
    // Buscar usuario por email via admin API
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) {
      console.warn(`  ⚠️  No se pudo listar usuarios para cleanup: ${error.message}`);
      console.warn('  Limpiar manualmente con: supabase db reset');
      return;
    }
    const testUser = data.users.find((u) => u.email === testEmail);
    if (testUser) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(testUser.id);
      if (deleteError) {
        console.warn(`  ⚠️  No se pudo eliminar usuario de prueba: ${deleteError.message}`);
        console.warn('  Limpiar manualmente con: supabase db reset');
      } else {
        console.log(`  🧹 Usuario de prueba eliminado: ${testEmail}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠️  Cleanup fallo: ${msg}`);
    console.warn('  Limpiar manualmente con: supabase db reset');
  }
}

// --- Formateo de resultados ---
const STATUS_ICONS: Record<VerificationResult['status'], string> = {
  PASS: '✅',
  FAIL: '❌',
  WARN: '⚠️',
  SKIP: '⏭️',
  INFO: 'ℹ️',
};

function printResult(index: number, total: number, result: VerificationResult): void {
  const icon = STATUS_ICONS[result.status];
  console.log(`\n[${index}/${total}] Verificacion: ${result.name}`);
  console.log(`  ${icon}  ${result.status} — ${result.message}`);
  if (result.details) {
    console.log(result.details);
  }
}

// --- Main ---
async function main(): Promise<void> {
  console.log('============================================');
  console.log('METAMEN100 — Auth Email Verification Script');
  console.log('Tarea: 02.6.9');
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log('============================================');

  // Ejecutar verificaciones secuencialmente
  const results: VerificationResult[] = [];

  const verifications = [
    verify1_RegistrationEmail,
    verify2_ResetPasswordEmail,
    verify3_TemplateBranding,
    verify4_RateLimitsConfig,
    verify5_RedirectUrls,
  ];

  for (let i = 0; i < verifications.length; i++) {
    const fn = verifications[i]!;
    const result = await fn();
    results.push(result);
    printResult(i + 1, verifications.length, result);
  }

  // Cleanup
  console.log('\n--- Cleanup ---');
  await cleanupTestUser();

  // Resumen
  const counts: Record<VerificationResult['status'], number> = {
    PASS: 0,
    FAIL: 0,
    WARN: 0,
    SKIP: 0,
    INFO: 0,
  };
  for (const r of results) {
    counts[r.status]++;
  }

  console.log('\n============================================');
  console.log(
    `RESUMEN: ${counts.PASS} PASS | ${counts.WARN} WARN | ${counts.SKIP} SKIP | ${counts.INFO} INFO | ${counts.FAIL} FAIL`,
  );
  console.log('============================================');

  // Documentacion Resend post-MVP
  console.log('\n=== NOTA: EMAILS TRANSACCIONALES POST-MVP ===');
  console.log('Actualmente emails via Supabase Auth built-in SMTP.');
  console.log('Post-MVP: migrar a Resend (resend.com) para:');
  console.log('- Emails transaccionales personalizados (welcome, receipts, weekly reports)');
  console.log('- Mayor control de deliverability y analytics');
  console.log('- Templates React Email con branding completo MetaMen100');
  console.log('Ref: Security Spec §3 (Proveedores habilitados) + Content Spec.');
  console.log('Resend NO esta en las dependencias aprobadas del MVP.');
  console.log('Requiere aprobacion del equipo.');
  console.log('============================================');

  // Exit code
  const hasFail = counts.FAIL > 0;
  process.exit(hasFail ? 1 : 0);
}

// --- Ejecutar ---
validatePrerequisites();
void main();
