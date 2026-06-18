// Controller de health check / status do serviço.
import { success } from '../utils/ApiResponse.js';
import geminiService from '../services/geminiService.js';
import env from '../config/env.js';

export const healthController = {
  check(_req, res) {
    return success(res, {
      status: 'ok',
      service: 'gml-backend',
      uptime: Math.round(process.uptime()),
      environment: env.nodeEnv,
      ai: {
        provider: 'google-gemini',
        model: env.gemini.model,
        available: geminiService.isAvailable(),
      },
    });
  },
};

export default healthController;
