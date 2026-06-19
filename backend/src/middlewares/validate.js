// ============================================================
// Validadores de entrada (sem dependências externas).
// Mantêm os controllers limpos e as regras de validação reutilizáveis.
// ============================================================
import ApiError from '../utils/ApiError.js';

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/** Valida o corpo do endpoint de chat. */
export function validateChat(req, _res, next) {
  const { prompt, history } = req.body || {};

  if (!isNonEmptyString(prompt)) {
    return next(ApiError.badRequest('O campo "prompt" é obrigatório e deve ser um texto não vazio.'));
  }
  if (prompt.length > 8000) {
    return next(ApiError.badRequest('O campo "prompt" excede o limite de 8000 caracteres.'));
  }
  if (history !== undefined) {
    if (!Array.isArray(history)) {
      return next(ApiError.badRequest('O campo "history" deve ser uma lista de mensagens.'));
    }
    const ok = history.every(
      (m) => m && typeof m === 'object' && typeof m.role === 'string' && typeof m.text === 'string',
    );
    if (!ok) {
      return next(ApiError.badRequest('Cada item de "history" deve conter { role, text }.'));
    }
  }
  next();
}

/** Valida o corpo do endpoint do assistente contextual (/assist). */
export function validateAssist(req, _res, next) {
  const { prompt, history, estado } = req.body || {};

  if (!isNonEmptyString(prompt)) {
    return next(ApiError.badRequest('O campo "prompt" é obrigatório e deve ser um texto não vazio.'));
  }
  if (prompt.length > 8000) {
    return next(ApiError.badRequest('O campo "prompt" excede o limite de 8000 caracteres.'));
  }
  if (history !== undefined && !Array.isArray(history)) {
    return next(ApiError.badRequest('O campo "history" deve ser uma lista de mensagens.'));
  }
  if (estado !== undefined && (typeof estado !== 'object' || estado === null || Array.isArray(estado))) {
    return next(ApiError.badRequest('O campo "estado" deve ser um objeto { licencas, demandas, evidencias }.'));
  }
  next();
}

/** Valida o endpoint de extração por texto. */
export function validateLicenseText(req, _res, next) {
  const { text } = req.body || {};
  if (!isNonEmptyString(text)) {
    return next(ApiError.badRequest('O campo "text" é obrigatório e deve ser um texto não vazio.'));
  }
  next();
}

/** Garante que um arquivo foi enviado no upload. */
export function requireFile(req, _res, next) {
  if (!req.file) {
    return next(ApiError.badRequest('Nenhum arquivo enviado. Use o campo "file" (PDF ou imagem).'));
  }
  next();
}
