// ============================================================
// Middleware central de tratamento de erros.
// Garante resposta padronizada e logging consistente, sem vazar stack
// traces ao cliente em produção.
// ============================================================
import ApiError from '../utils/ApiError.js';
import { failure } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  // Erros de upload (multer) → 400.
  if (err?.name === 'MulterError') {
    return failure(res, { status: 400, code: 'UPLOAD_ERROR', message: traduzMulter(err) });
  }

  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.statusCode : 500;

  // 5xx é incidente: loga com stack. 4xx é esperado: loga em nível baixo.
  const logMeta = { method: req.method, path: req.originalUrl, status, code: err?.code };
  if (status >= 500) {
    logger.error(err.message, { ...logMeta, stack: err.stack });
  } else {
    logger.warn(err.message, logMeta);
  }

  return failure(res, {
    status,
    code: err?.code || 'INTERNAL_ERROR',
    message: isApiError || status < 500 ? err.message : 'Erro interno do servidor.',
    details: isApiError ? err.details : env.isProduction ? undefined : err.message,
  });
}

function traduzMulter(err) {
  if (err.code === 'LIMIT_FILE_SIZE') return 'Arquivo excede o tamanho máximo permitido.';
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return 'Campo de arquivo inesperado. Use o campo "file".';
  return `Falha no upload do arquivo: ${err.message}`;
}
