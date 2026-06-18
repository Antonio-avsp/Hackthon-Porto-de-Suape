// ============================================================
// Logger minimalista, estruturado e sem dependências externas.
// Saída em JSON quando em produção (amigável a coletores de log),
// e legível (colorido) em desenvolvimento.
// ============================================================
import env from '../config/env.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m', debug: '\x1b[90m', reset: '\x1b[0m' };

const activeLevel = env.isProduction ? LEVELS.info : LEVELS.debug;

function log(level, message, meta) {
  if (LEVELS[level] > activeLevel) return;
  const timestamp = new Date().toISOString();

  if (env.isProduction) {
    process.stdout.write(`${JSON.stringify({ timestamp, level, message, ...(meta || {}) })}\n`);
    return;
  }

  const color = COLORS[level] || '';
  const tag = `${color}[${level.toUpperCase()}]${COLORS.reset}`;
  const extra = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  process.stdout.write(`${timestamp} ${tag} ${message}${extra}\n`);
}

const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

export default logger;
