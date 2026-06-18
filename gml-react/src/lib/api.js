// ============================================================
// Cliente do backend de IA (GML Backend).
// Centraliza as chamadas HTTP para a API — a chave da LLM fica no
// servidor, nunca no navegador. Fluxo:
//   Frontend → API Backend → Gemini → Backend → Frontend
// ============================================================

// URL base do backend. Pode ser sobrescrita em tempo de build
// (VITE_API_URL) ou em runtime, pelo modal "Configurar IA" (localStorage).
const DEFAULT_API = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3333';
const API_URL_KEY = 'gml_api_url';

export const getApiBase = () => (localStorage.getItem(API_URL_KEY) || DEFAULT_API).replace(/\/$/, '');
export const setApiBase = (v) => {
  const url = (v || '').trim().replace(/\/$/, '');
  if (url) localStorage.setItem(API_URL_KEY, url);
  else localStorage.removeItem(API_URL_KEY);
};

/** Lança um Error de conexão padronizado (backend fora do ar / CORS). */
function connectionError() {
  const e = new Error('Não foi possível conectar ao backend de IA.');
  e.connection = true;
  return e;
}

/** Interpreta a resposta no envelope padrão { success, data, error }. */
async function parse(resp) {
  const json = await resp.json().catch(() => null);
  if (!resp.ok || !json || json.success === false) {
    const err = new Error(json?.error?.message || `HTTP ${resp.status}`);
    err.status = resp.status;
    err.code = json?.error?.code;
    throw err;
  }
  return json.data;
}

/** GET /api/health — status do serviço e disponibilidade da IA. */
export async function checkHealth() {
  let resp;
  try {
    resp = await fetch(`${getApiBase()}/api/health`);
  } catch {
    throw connectionError();
  }
  return parse(resp); // { status, ai: { available, model, provider } }
}

/**
 * POST /api/ai/licenses/extract — lê um PDF/imagem de licença.
 * Retorna o objeto já no formato do cartão/cadastro do frontend.
 */
export async function extractLicense(file) {
  const form = new FormData();
  form.append('file', file);
  let resp;
  try {
    resp = await fetch(`${getApiBase()}/api/ai/licenses/extract`, { method: 'POST', body: form });
  } catch {
    throw connectionError();
  }
  const data = await parse(resp);
  return data.license;
}

/**
 * POST /api/ai/chat — conversa de texto com o assistente.
 * @param {string} prompt
 * @param {Array<{role:string,text:string}>} [history]
 * @returns {Promise<string>} resposta da IA
 */
export async function chatWithAI(prompt, history = []) {
  let resp;
  try {
    resp = await fetch(`${getApiBase()}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history }),
    });
  } catch {
    throw connectionError();
  }
  const data = await parse(resp);
  return data.reply;
}
