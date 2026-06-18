// ============================================================
// Carregamento e validação centralizada das variáveis de ambiente.
// Uma única fonte de verdade para a configuração da aplicação.
// ============================================================
import dotenv from 'dotenv';

dotenv.config();

/** Converte string para inteiro com valor padrão seguro. */
function toInt(value, fallback) {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Normaliza a lista de origens do CORS. */
function parseOrigins(value) {
  if (!value || value.trim() === '*') return '*';
  return value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: toInt(process.env.PORT, 3333),
  corsOrigin: parseOrigins(process.env.CORS_ORIGIN),

  // Proteção opcional das rotas de IA.
  apiKey: process.env.API_KEY || '',

  // Placeholder — reservado para uma futura camada de persistência.
  databaseUrl: process.env.DATABASE_URL || '',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    baseUrl: (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, ''),
    timeoutMs: toInt(process.env.GEMINI_TIMEOUT_MS, 30000),
    maxRetries: toInt(process.env.GEMINI_MAX_RETRIES, 2),
  },
});

/**
 * Valida a configuração mínima necessária e devolve a lista de avisos.
 * Não derruba a aplicação: o servidor sobe em modo degradado e cada
 * rota afetada responde com erro claro, facilitando o desenvolvimento.
 */
export function validateEnv() {
  const warnings = [];
  if (!env.gemini.apiKey) {
    warnings.push('GEMINI_API_KEY não definida — as rotas de IA responderão 503 até ser configurada.');
  }
  if (env.isProduction && !env.apiKey) {
    warnings.push('API_KEY não definida em produção — as rotas de IA estão abertas (sem autenticação).');
  }
  return warnings;
}

export default env;
