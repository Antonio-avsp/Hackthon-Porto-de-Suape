// ============================================================
// Rotas de IA. Todas protegidas por rate-limit e autenticação opcional.
// ============================================================
import { Router } from 'express';
import aiController from '../controllers/ai.controller.js';
import apiKeyAuth from '../middlewares/auth.js';
import aiRateLimiter from '../middlewares/rateLimiter.js';
import uploadLicenseFile from '../middlewares/upload.js';
import { validateChat, validateAssist, validateLicenseText, requireFile } from '../middlewares/validate.js';

const router = Router();

// Proteções comuns a todas as rotas de IA.
router.use(aiRateLimiter, apiKeyAuth);

// POST /api/ai/assist — assistente contextual (intenção + dados reais + modelo)
router.post('/assist', validateAssist, aiController.assist);

// POST /api/ai/chat — conversa direta com o modelo (legado/aberto)
router.post('/chat', validateChat, aiController.chat);

// POST /api/ai/licenses/extract  (multipart/form-data, campo "file")
router.post('/licenses/extract', uploadLicenseFile, requireFile, aiController.extractLicenseFile);

// POST /api/ai/licenses/ingest  — AUTOMAÇÃO: extrai, valida e cadastra (auto se limpo)
router.post('/licenses/ingest', uploadLicenseFile, requireFile, aiController.ingestLicenseFile);

// POST /api/ai/licenses/ingest/confirm  — grava a licença revisada (1 clique)
router.post('/licenses/ingest/confirm', aiController.confirmLicenseIngest);

// POST /api/ai/licenses/extract-text  (application/json, campo "text")
router.post('/licenses/extract-text', validateLicenseText, aiController.extractLicenseText);

export default router;
