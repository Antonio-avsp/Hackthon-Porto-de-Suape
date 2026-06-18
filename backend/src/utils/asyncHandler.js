// ============================================================
// Encapsula handlers assíncronos do Express, encaminhando qualquer
// rejeição para o middleware central de erros (evita try/catch repetido).
// ============================================================
/** @param {Function} fn handler async (req, res, next) */
export default function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
