// ============================================================
// Ponto de entrada: inicia o servidor HTTP e o ciclo de vida do processo.
// ============================================================
import app from './app.js';
import env, { validateEnv } from './config/env.js';
import logger from './utils/logger.js';

// Avisos de configuração (não bloqueiam a inicialização).
for (const warning of validateEnv()) logger.warn(warning);

const server = app.listen(env.port, () => {
  logger.info(`🚀 GML Backend rodando em http://localhost:${env.port} (${env.nodeEnv})`);
  logger.info(`   IA: ${env.gemini.model} via Google Gemini`);
});

// --- Encerramento gracioso ---
function shutdown(signal) {
  logger.info(`Recebido ${signal} — encerrando o servidor...`);
  server.close(() => {
    logger.info('Servidor encerrado.');
    process.exit(0);
  });
  // Failsafe: força a saída se demorar demais.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Rejeição não tratada (unhandledRejection).', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Exceção não capturada (uncaughtException).', { message: err.message, stack: err.stack });
  process.exit(1);
});

export default server;
