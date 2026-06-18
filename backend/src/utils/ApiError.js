// ============================================================
// Erro de aplicação com status HTTP e código semântico.
// Permite ao errorHandler central responder de forma padronizada.
// ============================================================
export default class ApiError extends Error {
  /**
   * @param {number} statusCode  Código HTTP (ex.: 400, 404, 503).
   * @param {string} message     Mensagem legível para o cliente.
   * @param {object} [options]
   * @param {string} [options.code]     Código semântico (ex.: 'VALIDATION_ERROR').
   * @param {unknown} [options.details] Detalhes adicionais (ex.: campos inválidos).
   * @param {Error}  [options.cause]    Erro de origem, para logging.
   */
  constructor(statusCode, message, { code, details, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || codeFromStatus(statusCode);
    this.details = details;
    this.isOperational = true;
    if (cause) this.cause = cause;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, { code: 'VALIDATION_ERROR', details });
  }

  static unauthorized(message = 'Não autorizado.') {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static notFound(message = 'Recurso não encontrado.') {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static serviceUnavailable(message, details) {
    return new ApiError(503, message, { code: 'SERVICE_UNAVAILABLE', details });
  }

  static badGateway(message, details) {
    return new ApiError(502, message, { code: 'UPSTREAM_ERROR', details });
  }
}

function codeFromStatus(status) {
  const map = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    408: 'TIMEOUT',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    502: 'UPSTREAM_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[status] || 'ERROR';
}
