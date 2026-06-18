// ============================================================
// Configuração da aplicação Express (sem iniciar o servidor).
// Separar `app` de `server` facilita testes e reuso.
// ============================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import env from './config/env.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// --- Segurança e infraestrutura ---
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
  }),
);

// --- Parsers ---
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Log de requisições HTTP ---
app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: { write: (line) => logger.info(line.trim()) },
  }),
);

// --- Rotas ---
app.get('/', (_req, res) => res.json({ name: 'GML Backend API', docs: '/api/health' }));
app.use('/api', routes);

// --- 404 e tratamento central de erros (sempre por último) ---
app.use(notFound);
app.use(errorHandler);

export default app;
