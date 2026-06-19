// Agregador de rotas da API (prefixo /api).
import { Router } from 'express';
import healthRoutes from './health.routes.js';
import aiRoutes from './ai.routes.js';
import environmentalRoutes from './environmental.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/ai', aiRoutes);
router.use('/environmental', environmentalRoutes);

export default router;
