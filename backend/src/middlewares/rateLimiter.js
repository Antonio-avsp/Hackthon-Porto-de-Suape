// ============================================================
// Limitador de requisições para proteger as rotas de IA (custo/abuso).
// ============================================================
import rateLimit from 'express-rate-limit';
import { failure } from '../utils/ApiResponse.js';

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requisições/minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    failure(res, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Muitas requisições. Aguarde um instante e tente novamente.',
    }),
});

export default aiRateLimiter;
