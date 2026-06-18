// ============================================================
// Autenticação simples por API key (header `x-api-key`).
// Ativada apenas quando env.apiKey está definida — caso contrário, é
// transparente (útil para demonstração/desenvolvimento).
// ============================================================
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export default function apiKeyAuth(req, _res, next) {
  if (!env.apiKey) return next(); // proteção desligada

  const provided = req.get('x-api-key') || req.query.api_key;
  if (provided && timingSafeEqual(provided, env.apiKey)) return next();

  return next(ApiError.unauthorized('API key ausente ou inválida.'));
}

/** Comparação de tempo constante para evitar timing attacks. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
