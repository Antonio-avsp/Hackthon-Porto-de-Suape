// ============================================================
// Camada de serviço exclusiva da LLM (Gemini Flash Lite 3.1).
// Orquestra prompts e a montagem do payload, delegando o transporte
// ao geminiClient. É o único ponto que o restante da aplicação usa
// para falar com a IA — facilitando troca de modelo/provedor.
// ============================================================
import geminiClient from '../integrations/gemini/geminiClient.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

const DEFAULT_SYSTEM_INSTRUCTION =
  'Você é o Assistente de Gestão Ambiental da plataforma GML (Porto de Suape). ' +
  'Responda em português do Brasil, de forma objetiva, técnica e cordial, ' +
  'no contexto de licenças ambientais, condicionantes, prazos e conformidade.';

/** Contexto temporal injetado no prompt para a IA responder com a data correta. */
function currentDateContext() {
  const now = new Date();
  const data = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  return `Para sua referência, a data de hoje é ${data} — considere ${now.getFullYear()} como o ano atual ao tratar de prazos, validades e vencimentos.`;
}

/** Converte o histórico do chat para o formato `contents` do Gemini. */
function buildContents(prompt, history = []) {
  const contents = history
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({
      role: m.role === 'assistant' || m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));
  contents.push({ role: 'user', parts: [{ text: prompt }] });
  return contents;
}

export const geminiService = {
  /** Disponibilidade da integração (usado pelo health check). */
  isAvailable() {
    return geminiClient.isConfigured();
  },

  /**
   * Conversa de texto com o assistente.
   * @param {object} params
   * @param {string} params.prompt
   * @param {Array<{role:string,text:string}>} [params.history]
   * @param {string} [params.systemInstruction]
   * @param {number} [params.temperature]
   * @returns {Promise<{ reply: string }>}
   */
  async chat({ prompt, history = [], systemInstruction, temperature = 0.4 }) {
    const base = systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
    const instruction = `${base} ${currentDateContext()}`;

    const { text } = await geminiClient.generateContent(buildContents(prompt, history), {
      systemInstruction: {
        role: 'system',
        parts: [{ text: instruction }],
      },
      generationConfig: { temperature },
    });

    if (!text) {
      throw ApiError.badGateway('A IA retornou uma resposta vazia.');
    }
    return { reply: text };
  },

  /**
   * Geração com saída estruturada (JSON) validada por schema.
   * Usada pela leitura de licenças (texto ou documento/imagem).
   * @param {object} params
   * @param {Array<object>} params.parts  Partes de conteúdo (texto e/ou inlineData).
   * @param {object} params.schema        responseSchema do Gemini.
   * @param {string} [params.systemInstruction]
   * @param {number} [params.temperature]  Padrão 0.1 (extração); ~0.4 p/ consultivo.
   * @returns {Promise<object>} JSON já parseado.
   */
  async generateStructured({ parts, schema, systemInstruction, temperature = 0.1 }) {
    const { text } = await geminiClient.generateContent([{ role: 'user', parts }], {
      systemInstruction: systemInstruction
        ? { role: 'system', parts: [{ text: systemInstruction }] }
        : undefined,
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    try {
      return JSON.parse(text);
    } catch (err) {
      logger.error('Resposta estruturada da IA não é um JSON válido.', { preview: text.slice(0, 200) });
      throw ApiError.badGateway('A IA não retornou um JSON válido.', { cause: err });
    }
  },
};

export default geminiService;
