// ============================================================
// Cliente de baixo nível para a Google Generative Language API (Gemini).
// Responsabilidade única: transporte HTTP, timeout, retry e tradução de
// erros da API. NÃO contém regra de negócio (isso fica no geminiService).
//
// Trocar de provedor/modelo no futuro = reimplementar apenas esta classe,
// mantendo o método público `generateContent(contents, options)`.
// ============================================================
import env from '../../config/env.js';
import logger from '../../utils/logger.js';
import ApiError from '../../utils/ApiError.js';

export class GeminiClient {
  constructor(config = env.gemini) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs;
    this.maxRetries = config.maxRetries;
  }

  /** Indica se o cliente está pronto para uso (chave configurada). */
  isConfigured() {
    return Boolean(this.apiKey);
  }

  /**
   * Executa uma geração de conteúdo no Gemini.
   * @param {Array<object>} contents  Estrutura `contents` da API do Gemini.
   * @param {object} [options]
   * @param {object} [options.generationConfig]  Ex.: { temperature, responseMimeType, responseSchema }.
   * @param {object} [options.systemInstruction] Instrução de sistema (papel do assistente).
   * @returns {Promise<{ text: string, raw: object }>}
   */
  async generateContent(contents, { generationConfig, systemInstruction } = {}) {
    if (!this.isConfigured()) {
      throw ApiError.serviceUnavailable(
        'Integração com a IA indisponível: GEMINI_API_KEY não configurada no servidor.',
      );
    }

    const url = `${this.baseUrl}/models/${this.model}:generateContent`;
    const body = JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction } : {}),
      ...(generationConfig ? { generationConfig } : {}),
    });

    const raw = await this.#requestWithRetry(url, body);
    return { text: extractText(raw), raw };
  }

  /** Chamada HTTP com timeout e retry exponencial para erros transitórios. */
  async #requestWithRetry(url, body) {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await this.#request(url, body);
      } catch (err) {
        const retriable = err instanceof TransientError;
        if (!retriable || attempt >= this.maxRetries) {
          throw this.#toApiError(err);
        }
        const delay = 2 ** attempt * 500; // 500ms, 1s, 2s...
        logger.warn('Falha transitória na chamada ao Gemini — repetindo.', {
          attempt: attempt + 1,
          delayMs: delay,
          reason: err.message,
        });
        await sleep(delay);
        attempt += 1;
      }
    }
  }

  /** Uma única requisição HTTP com AbortController para o timeout. */
  async #request(url, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const resp = await fetch(`${url}?key=${encodeURIComponent(this.apiKey)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: controller.signal,
      });

      if (!resp.ok) {
        const payload = await safeJson(resp);
        const message = payload?.error?.message || `HTTP ${resp.status}`;
        // 429 e 5xx são transitórios; demais são definitivos.
        if (resp.status === 429 || resp.status >= 500) {
          throw new TransientError(message, resp.status);
        }
        throw new PermanentError(message, resp.status);
      }

      return await resp.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new TransientError(`Tempo limite excedido (${this.timeoutMs}ms).`, 408);
      }
      if (err instanceof TransientError || err instanceof PermanentError) throw err;
      // Erros de rede (DNS, conexão) são transitórios.
      throw new TransientError(err.message, 502);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Converte erros internos do cliente em ApiError padronizado.
   * O erro de origem vai em `cause` (apenas para logging) — nunca no `details`
   * exposto ao cliente.
   */
  #toApiError(err) {
    if (err.statusCode === 408) {
      return new ApiError(504, 'A IA demorou para responder. Tente novamente.', {
        code: 'UPSTREAM_TIMEOUT',
        cause: err,
      });
    }
    if (err.statusCode === 401 || err.statusCode === 403) {
      return new ApiError(503, 'Credenciais da IA inválidas ou sem permissão.', {
        code: 'SERVICE_UNAVAILABLE',
        cause: err,
      });
    }
    if (err.statusCode === 429) {
      return new ApiError(429, 'Limite de uso da IA atingido. Tente novamente em instantes.', {
        code: 'RATE_LIMITED',
        cause: err,
      });
    }
    return new ApiError(502, `Falha na comunicação com a IA: ${err.message}`, {
      code: 'UPSTREAM_ERROR',
      cause: err,
    });
  }
}

// --- Erros internos do cliente (não vazam para fora) ---
class TransientError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
class PermanentError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/** Extrai o texto concatenado da resposta do Gemini. */
function extractText(raw) {
  const parts = raw?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('').trim();
}

async function safeJson(resp) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Instância única (singleton) compartilhada pela aplicação.
export default new GeminiClient();
