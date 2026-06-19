// ============================================================
// Controller de IA: orquestra requisição → service → resposta.
// Não contém regra de negócio nem detalhes da LLM (ficam nos services).
// ============================================================
import { success } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import geminiService from '../services/geminiService.js';
import licenseService from '../services/license.service.js';
import assistantService from '../services/assistant.service.js';
import conversationRepository from '../repositories/conversation.repository.js';

export const aiController = {
  /**
   * POST /api/ai/assist — assistente contextual da A.L.I.A.
   * Orquestra intenção determinística → dados reais → modelo (com fallback),
   * espelhando o fluxo do Consultor IA do BB. O frontend envia o estado real
   * da plataforma (`estado`) para que toda a inteligência rode no servidor.
   */
  assist: asyncHandler(async (req, res) => {
    const { prompt, estado = {}, history = [], conversationId, refDate } = req.body;

    const resultado = await assistantService.assist({ prompt, estado, history, refDate });

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

  /** POST /api/ai/licenses/extract-text — extrai dados de licença de texto bruto. */
  extractLicenseText: asyncHandler(async (req, res) => {
    const data = await licenseService.extractFromText({ text: req.body.text });
    return success(res, { license: data });
  }),
};

export default aiController;
