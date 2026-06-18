// Captura rotas inexistentes e encaminha um 404 padronizado.
import ApiError from '../utils/ApiError.js';

export default function notFound(req, _res, next) {
  next(ApiError.notFound(`Rota não encontrada: ${req.method} ${req.originalUrl}`));
}
