// ============================================================
// Cliente do backend de IA (GML Backend).
// Centraliza as chamadas HTTP para a API — a chave da LLM fica no
// servidor, nunca no navegador. Fluxo:
//   Frontend → API Backend → Gemini → Backend → Frontend
// ============================================================

// URL base do backend — conectado automaticamente (sem configuração).
// Padrão localhost:3333; pode ser ajustada em build via VITE_API_URL.
const DEFAULT_API = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3333';

export const getApiBase = () => DEFAULT_API.replace(/\/$/, '');

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
 * POST /api/ai/licenses/ingest — AUTOMAÇÃO: lê o PDF/imagem, valida e, se a
 * validação passar limpa, JÁ CADASTRA na fonte única (que alimenta a planilha).
 * @returns {Promise<{status:'ingested'|'review',autoCommitted:boolean,license:object,validacao:object,source:string}>}
 */
export async function ingestLicense(file) {
  const form = new FormData();
  form.append('file', file);
  let resp;
  try {
    resp = await fetch(`${getApiBase()}/api/ai/licenses/ingest`, { method: 'POST', body: form });
  } catch {
    throw connectionError();
  }
  return parse(resp);
}

/** POST /api/ai/licenses/ingest/confirm — grava a licença revisada (1 clique). */
export async function confirmIngest(license) {
  let resp;
  try {
    resp = await fetch(`${getApiBase()}/api/ai/licenses/ingest/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license }),
    });
  } catch {
    throw connectionError();
  }
  return parse(resp);
}

/** GET /api/spreadsheet/controle.xlsx — baixa a planilha de controle preenchida. */
export async function downloadControle() {
  let resp;
  try {
    resp = await fetch(`${getApiBase()}/api/spreadsheet/controle.xlsx`);
  } catch {
    throw connectionError();
  }
  if (!resp.ok) {
    const err = new Error(`HTTP ${resp.status}`);
    err.status = resp.status;
    throw err;
  }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Controle_de_Licencas_GML_${new Date().getFullYear()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * POST /api/ai/assist — assistente contextual da A.L.I.A.
 * O backend é a FONTE ÚNICA DE VERDADE (Fase 3): roda intenção determinística +
 * contexto + modelo sobre o estado PERSISTIDO no servidor (espelha o Consultor
 * IA do BB). Não é preciso enviar o estado — basta a pergunta e o histórico.
 * @param {string} prompt
 * @param {Array<{role:string,text:string}>} [history]
 * @returns {Promise<{resposta:string,destaques:string[],acao_sugerida:string,intencao:string,fonte:string,kpis:object,score:object}>}
 */
export async function assistAI(prompt, history = [], conversationId = null) {
  let resp;
  try {
    resp = await fetch(`${getApiBase()}/api/ai/assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history, ...(conversationId ? { conversationId } : {}) }),
    });
  } catch {
    throw connectionError();
  }
  return parse(resp); // { resposta, destaques, acao_sugerida, intencao, fonte, kpis, score, conversationId }
}

// ---- Estado ambiental (Fase 3: fonte única no servidor) ----

/** GET /api/environmental/state — estado persistido (licenças, demandas, evidências). */
export async function fetchEnvState() {
  let resp;
  try {
    resp = await fetch(`${getApiBase()}/api/environmental/state`);
  } catch {
    throw connectionError();
  }
  return parse(resp);
}

async function envFetch(pathname, method, body) {
  let resp;
  try {
    resp = await fetch(`${getApiBase()}/api/environmental${pathname}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw connectionError();
  }
  return parse(resp);
}

export const envApi = {
  addLicenca: (lic) => envFetch('/licencas', 'POST', lic),
  updateLicenca: (id, patch) => envFetch(`/licencas/${encodeURIComponent(id)}`, 'PATCH', patch),
  deleteLicenca: (id) => envFetch(`/licencas/${encodeURIComponent(id)}`, 'DELETE'),
  upsertFromExtract: (extract) => envFetch('/licencas/extract-upsert', 'POST', extract),
  replaceDemandas: (demandas) => envFetch('/demandas', 'PUT', { demandas }),
  replaceEvidencias: (evidencias) => envFetch('/evidencias', 'PUT', { evidencias }),
};

/**
 * POST /api/ai/chat — conversa de texto direta com o modelo (legado/aberto).
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
