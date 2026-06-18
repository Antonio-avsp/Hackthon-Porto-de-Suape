// ============================================================
// Envelope padronizado para todas as respostas da API.
// Mantém o contrato estável para o frontend: { success, data | error, meta }.
// ============================================================

/** Resposta de sucesso. */
export function success(res, data, { status = 200, meta } = {}) {
  return res.status(status).json({
    success: true,
    data: data ?? null,
    meta: { timestamp: new Date().toISOString(), ...(meta || {}) },
  });
}

/** Resposta de erro padronizada (usada pelo errorHandler). */
export function failure(res, { status = 500, message, code = 'ERROR', details } = {}) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message: message || 'Erro interno do servidor.',
      ...(details !== undefined ? { details } : {}),
    },
    meta: { timestamp: new Date().toISOString() },
  });
}
