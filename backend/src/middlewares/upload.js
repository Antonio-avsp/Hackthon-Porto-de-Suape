// ============================================================
// Configuração do upload de arquivos (multer) para leitura de licenças.
// Armazena em memória (buffer) — o arquivo é enviado direto à IA e
// descartado, sem tocar o disco.
// ============================================================
import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
]);

const storage = multer.memoryStorage();

export const uploadLicenseFile = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(ApiError.badRequest(`Tipo de arquivo não suportado: ${file.mimetype}. Envie PDF ou imagem.`));
  },
}).single('file');

export default uploadLicenseFile;
