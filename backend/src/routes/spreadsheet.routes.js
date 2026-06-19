// ============================================================
// Rotas da Planilha de Controle (.xlsx). Protegidas por rate-limit e auth opc.
// ============================================================
import { Router } from 'express';
import spreadsheetController from '../controllers/spreadsheet.controller.js';
import apiKeyAuth from '../middlewares/auth.js';
import aiRateLimiter from '../middlewares/rateLimiter.js';

const router = Router();
router.use(aiRateLimiter, apiKeyAuth);

// GET /api/spreadsheet/controle.xlsx
router.get('/controle.xlsx', spreadsheetController.downloadControle);

export default router;
