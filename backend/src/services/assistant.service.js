// ============================================================
// Orquestrador do Assistente A.L.I.A.
//
// Espelha a rota do Agente IA do Banco do Brasil (app/routes/ia_routes.py,
// função api_llm): uma camada determinística decide a intenção ANTES de tocar
// no modelo; saudações/capacidades/recusas e consultas operacionais exatas são
// respondidas sem LLM; apenas pedidos analíticos/abertos chamam o Gemini, com
// CONTEXTO real e escopado — e sempre com fallback determinístico se o modelo
// falhar. O modelo nunca é a fonte da verdade: é a camada de linguagem natural
// sobre um núcleo determinístico e auditável.
// ============================================================
import {
  analisar, INTENCOES_DIRETAS, INTENCOES_OPERACIONAIS,
} from './intent.service.js';
import { snapshot, buildContext } from './environmentalContext.service.js';
import { respostaDireta, respostaOperacional, fallbackAnalitico } from './deterministicAnswers.service.js';
import { SYSTEM_PROMPT_ALIA, construirPromptConsultivo, CONSULT_RESPONSE_SCHEMA } from './prompts.js';
import geminiService from './geminiService.js';
import logger from '../utils/logger.js';

/** Normaliza a saída do modelo ao contrato { resposta, destaques, acao_sugerida }. */
function normalizar(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const resposta = String(raw.resposta || '').trim();
  if (!resposta) return null;
  const destaques = Array.isArray(raw.destaques) ? raw.destaques.map((d) => String(d).trim()).filter(Boolean).slice(0, 3) : [];
  return { resposta, destaques, acao_sugerida: String(raw.acao_sugerida || '').trim(), fonte: 'ia' };
}

/**
 * Responde a uma mensagem do usuário com base no estado real da plataforma.
 * @param {object} params
 * @param {string} params.prompt
 * @param {{licencas?:Array,demandas?:Array,evidencias?:Array}} [params.estado]
 * @param {Array<{role:string,text:string}>} [params.history]
 * @param {string|Date} [params.refDate]  Data de referência (default: hoje).
 * @returns {Promise<object>} { resposta, destaques, acao_sugerida, intencao, fonte, kpis, score }
 */
export async function assist({ prompt, estado = {}, history = [], refDate } = {}) {
  const { intencao, entidades } = analisar(prompt);

  // 1) Intenções DIRETAS — não tocam dados nem modelo.
  if (INTENCOES_DIRETAS.has(intencao)) {
    return finalize(respostaDireta(intencao), intencao, null);
  }

  // 2) A partir daqui, precisamos do estado real → snapshot determinístico.
  const snap = snapshot(estado, refDate);

  // 3) Intenções OPERACIONAIS — resposta EXATA a partir dos dados (sem modelo).
  if (INTENCOES_OPERACIONAIS.has(intencao)) {
    const op = respostaOperacional(intencao, entidades, snap);
    if (op) return finalize(op, intencao, snap);
  }

  // 4) Intenções ANALÍTICAS/abertas — contexto real + modelo (com fallback).
  if (!geminiService.isAvailable()) {
    return finalize(fallbackAnalitico(intencao, snap), intencao, snap);
  }

  try {
    const contexto = buildContext(snap, intencao);
    const promptCompleto = construirPromptConsultivo({
      mensagem: prompt, contexto, intencao, historico: history, refDate: snap.refDate,
    });
    const raw = await geminiService.generateStructured({
      parts: [{ text: promptCompleto }],
      schema: CONSULT_RESPONSE_SCHEMA,
      systemInstruction: SYSTEM_PROMPT_ALIA,
      temperature: 0.4,
    });
    const norm = normalizar(raw);
    if (norm) return finalize(norm, intencao, snap);
    logger.warn('Resposta do modelo fora do contrato — usando fallback determinístico.');
  } catch (err) {
    logger.warn('Modelo indisponível na consulta — usando fallback determinístico.', { reason: err.message });
  }
  return finalize(fallbackAnalitico(intencao, snap), intencao, snap);
}

/** Anexa metadados (intenção, KPIs, score) ao contrato de resposta. */
function finalize(resp, intencao, snap) {
  return {
    resposta: resp.resposta,
    destaques: resp.destaques || [],
    acao_sugerida: resp.acao_sugerida || '',
    intencao,
    fonte: resp.fonte || 'deterministico',
    kpis: snap ? snap.kpis : null,
    score: snap ? snap.score : null,
  };
}

export default { assist };
