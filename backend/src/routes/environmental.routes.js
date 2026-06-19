// ============================================================
// Rotas do estado ambiental (Fase 3) — fonte única de verdade no servidor.
// Protegidas por rate-limit e autenticação opcional (mesmo padrão das de IA).
// ============================================================
import { Router } from 'express';
import environmentalController from '../controllers/environmental.controller.js';
import apiKeyAuth from '../middlewares/auth.js';
import aiRateLimiter from '../middlewares/rateLimiter.js';

const router = Router();

router.use(aiRateLimiter, apiKeyAuth);

router.get('/state', environmentalController.getState);

router.post('/licencas', environmentalController.addLicenca);
router.post('/licencas/extract-upsert', environmentalController.upsertFromExtract);
router.patch('/licencas/:id', environmentalController.updateLicenca);
router.delete('/licencas/:id', environmentalController.deleteLicenca);

router.put('/demandas', environmentalController.replaceDemandas);
router.put('/evidencias', environmentalController.replaceEvidencias);

export default router;
