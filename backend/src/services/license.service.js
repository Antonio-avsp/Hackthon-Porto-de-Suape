// ============================================================
// Serviço de domínio: leitura/interpretação de licenças ambientais.
// Monta o prompt especialista, usa o geminiService para a extração
// estruturada e adapta o resultado para o contrato do frontend.
// ============================================================
import geminiService from './geminiService.js';
import { LICENSE_RESPONSE_SCHEMA, adaptLicenseExtract, SIGLAS_VALIDAS } from '../models/license.schema.js';
import { validateAndNormalizeLicense } from '../models/licenseValidation.js';

/** Adapta + valida/normaliza a extração (Fase 4) antes de virar cadastro. */
function adaptarEValidar(raw) {
  const { license, validacao } = validateAndNormalizeLicense(adaptLicenseExtract(raw));
  return { ...license, validacao };
}

const SYSTEM_INSTRUCTION =
  'Você é um analista sênior de gestão ambiental especializado em licenciamento brasileiro.';

const EXTRACTION_PROMPT =
  'Leia esta licença ambiental brasileira e extraia os dados de forma fiel ao documento. ' +
  `Identifique a sigla do tipo (uma de: ${SIGLAS_VALIDAS.join(', ')}), o órgão emissor, ` +
  'o número do processo, a data de validade, uma classificação de risco geral (Baixo, Médio ou Alto), ' +
  'um resumo de uma frase e todas as condicionantes (descrição, periodicidade, prazo e risco). ' +
  'Se algum campo não constar no documento, retorne "—". Responda apenas com os dados estruturados.';

export const licenseService = {
  /**
   * Extrai dados estruturados a partir de um arquivo (PDF ou imagem).
   * @param {object} params
   * @param {Buffer} params.buffer
   * @param {string} params.mimeType  Ex.: 'application/pdf', 'image/png'.
   */
  async extractFromFile({ buffer, mimeType }) {
    const parts = [
      { inlineData: { mimeType, data: buffer.toString('base64') } },
      { text: EXTRACTION_PROMPT },
    ];
    const raw = await geminiService.generateStructured({
      parts,
      schema: LICENSE_RESPONSE_SCHEMA,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
    return adaptarEValidar(raw);
  },

  /**
   * Extrai dados estruturados a partir de texto bruto de uma licença.
   * @param {object} params
   * @param {string} params.text
   */
  async extractFromText({ text }) {
    const parts = [{ text: `${EXTRACTION_PROMPT}\n\n--- DOCUMENTO ---\n${text}` }];
    const raw = await geminiService.generateStructured({
      parts,
      schema: LICENSE_RESPONSE_SCHEMA,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
    return adaptarEValidar(raw);
  },
};

export default licenseService;
