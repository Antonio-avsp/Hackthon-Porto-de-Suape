// ============================================================
// Controller de IA: orquestra requisição → service → resposta.
// Não contém regra de negócio nem detalhes da LLM (ficam nos services).
// ============================================================
import { success } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import geminiService from '../services/geminiService.js';
import licenseService from '../services/license.service.js';
import assistantService from '../services/assistant.service.js';
import conversationRepository from '../repositories/conversation.repository.js';
import environmentalRepository from '../repositories/environmental.repository.js';
import env from '../config/env.js';

export const aiController = {
  /**
   * POST /api/ai/assist — assistente contextual da A.L.I.A.
   * Orquestra intenção determinística → dados reais → modelo (com fallback),
   * espelhando o fluxo do Consultor IA do BB. O frontend envia o estado real
   * da plataforma (`estado`) para que toda a inteligência rode no servidor.
   */
  assist: asyncHandler(async (req, res) => {
    const { prompt, history = [], conversationId, refDate } = req.body;

    // Fonte única de verdade no servidor (Fase 3): o assistente lê o estado
    // persistido — não depende mais do que o cliente enviar.
    const estado = environmentalRepository.getState();
    const resultado = await assistantService.assist({
      prompt, estado, history, refDate: refDate || env.referenceDate,
    });

    // Persistência opcional do histórico (repositório em memória).
    const id = conversationId || conversationRepository.create();
    conversationRepository.appendMessage(id, { role: 'user', text: prompt });
    conversationRepository.appendMessage(id, { role: 'assistant', text: resultado.resposta });

    return success(res, { conversationId: id, ...resultado });
  }),

  /** POST /api/ai/chat — conversa de texto direta com o modelo (legado/aberto). */
  chat: asyncHandler(async (req, res) => {
    const { prompt, history = [], conversationId, systemInstruction } = req.body;

    const { reply } = await geminiService.chat({ prompt, history, systemInstruction });

    // Persistência opcional do histórico (repositório em memória).
    const id = conversationId || conversationRepository.create();
    conversationRepository.appendMessage(id, { role: 'user', text: prompt });
    conversationRepository.appendMessage(id, { role: 'assistant', text: reply });

    return success(res, { conversationId: id, reply });
  }),

  /** POST /api/ai/licenses/extract — extrai dados de licença de um arquivo. */
  extractLicenseFile: asyncHandler(async (req, res) => {
    const data = await licenseService.extractFromFile({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });
    return success(res, { source: req.file.originalname, license: data });
  }),

  /**
   * POST /api/ai/licenses/ingest — AUTOMAÇÃO Fase 5: extrai, valida e, se a
   * validação passar LIMPA (sem avisos), cadastra automaticamente na fonte única
   * (que alimenta a planilha). Havendo avisos, devolve para revisão de 1 clique.
   */
  ingestLicenseFile: asyncHandler(async (req, res) => {
    const data = await licenseService.extractFromFile({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });
    const limpo = !data.validacao || data.validacao.ok !== false;
    if (limpo) {
      const { created } = environmentalRepository.upsertFromExtract(data);
      // Devolve a EXTRAÇÃO (formato rico p/ o card) + sinal de que já foi gravada.
      return success(res, {
        status: 'ingested', autoCommitted: true, created, license: data,
        validacao: data.validacao, source: req.file.originalname,
      });
    }
    // Há avisos → não grava; pede revisão (mostra extração + avisos no front).
    return success(res, {
      status: 'review', autoCommitted: false, license: data,
      validacao: data.validacao, source: req.file.originalname,
    });
  }),

  /** POST /api/ai/licenses/ingest/confirm — grava a licença revisada (1 clique). */
  confirmLicenseIngest: asyncHandler(async (req, res) => {
    const license = req.body?.license;
    if (!license || !license.sigla) throw ApiError.badRequest('Envie a licença revisada em "license".');
    const { license: saved, created } = environmentalRepository.upsertFromExtract(license);
    return success(res, { status: 'ingested', autoCommitted: false, created, license: saved });
  }),

  /** POST /api/ai/licenses/extract-text — extrai dados de licença de texto bruto. */
  extractLicenseText: asyncHandler(async (req, res) => {
    const data = await licenseService.extractFromText({ text: req.body.text });
    return success(res, { license: data });
  }),
};

export default aiController;
