// ============================ Integração de IA (OCR / Visão) ============================
// Leitura real de licenças (PDF/imagem) via API do Claude (Anthropic), direto do navegador.
// ⚠️ Em produção, faça a chamada por um backend — a chave no navegador fica exposta.
import { tipoNome, riskColor } from '../data.js';

// Chave da API lida de variável de ambiente do Vite — configure UMA vez em gml-react/.env:
//   VITE_ANTHROPIC_API_KEY=sk-ant-...
// Assim a IA funciona sem nenhuma configuração na interface. Sem chave → modo demonstração.
export const getKey = () => (import.meta.env.VITE_ANTHROPIC_API_KEY || '').trim();
export const hasKey = () => !!getKey();

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

const EXTRACT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['tipo', 'sigla', 'orgao', 'processo', 'validade', 'classificacao_risco', 'resumo', 'condicionantes'],
  properties: {
    tipo: { type: 'string' },
    sigla: { type: 'string', enum: ['AUT', 'LP', 'LI', 'LO', 'RLO', 'PLI', 'CP', 'LS'] },
    orgao: { type: 'string' },
    processo: { type: 'string' },
    validade: { type: 'string' },
    classificacao_risco: { type: 'string', enum: ['Baixo', 'Médio', 'Alto'] },
    resumo: { type: 'string' },
    condicionantes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['descricao', 'periodicidade', 'prazo', 'risco'],
        properties: {
          descricao: { type: 'string' }, periodicidade: { type: 'string' }, prazo: { type: 'string' },
          risco: { type: 'string', enum: ['Baixo', 'Médio', 'Alto'] },
        },
      },
    },
  },
};

// Lê PDF/imagem de licença via Claude (visão) e devolve JSON estruturado.
export async function callAnthropicVision(file) {
  const key = getKey();
  if (!key) { const e = new Error('sem chave'); e.needKey = true; throw e; }
  const b64 = await fileToBase64(file);
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  const media = isPdf ? 'application/pdf' : (file.type || 'image/png');
  const docBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
    : { type: 'image', source: { type: 'base64', media_type: media, data: b64 } };
  const prompt =
    'Você é um analista de gestão ambiental. Leia esta licença ambiental brasileira e extraia os dados. ' +
    'Identifique a sigla do tipo (AUT, LP, LI, LO, RLO, PLI, CP ou LS), o órgão emissor, o número do processo, ' +
    'a data de validade, uma classificação de risco geral (Baixo/Médio/Alto), um resumo de uma frase e todas as condicionantes ' +
    '(descrição, periodicidade, prazo e risco). Responda apenas com os dados estruturados.';
  const body = {
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    messages: [{ role: 'user', content: [docBlock, { type: 'text', text: prompt }] }],
    output_config: { format: { type: 'json_schema', schema: EXTRACT_SCHEMA } },
  };
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    let msg = String(resp.status);
    try { const j = await resp.json(); msg = (j.error && j.error.message) || msg; } catch (_) {}
    throw new Error(msg);
  }
  const data = await resp.json();
  const txt = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  return JSON.parse(txt);
}

let exId = 0;
// Converte o JSON da IA para o formato do cartão/cadastro.
export function adaptExtract(j) {
  return {
    id: 'EX-' + (++exId) + '-' + Date.now(),
    sigla: j.sigla || 'LO', tipo: j.tipo || tipoNome(j.sigla), orgao: j.orgao || '—',
    processo: j.processo || '—', validade: j.validade || '—',
    risco: j.classificacao_risco || '—', riscoCor: riskColor(j.classificacao_risco),
    resumo: j.resumo || '—',
    cond: (Array.isArray(j.condicionantes) ? j.condicionantes : []).map((c) => ({
      descricao: c.descricao || '—', periodicidade: c.periodicidade || '—',
      prazo: c.prazo || '—', risco: c.risco || '—', cor: riskColor(c.risco),
    })),
  };
}

// Extração simulada (modo demonstração, sem chave/arquivo real).
export function buildSampleExtract() {
  return {
    id: 'EX-DEMO-' + (++exId) + '-' + Date.now(),
    sigla: 'LO', tipo: 'Licença de Operação', orgao: 'CPRH', processo: '2023.045.PE',
    validade: '07/06/2025', risco: 'Alto', riscoCor: '#DC3545',
    resumo: 'Operação de terminal de granéis e contêineres em Suape/PE, com condicionantes de monitoramento e renovação a vencer.',
    cond: [
      { descricao: 'Monitoramento mensal da qualidade dos efluentes hídricos', periodicidade: 'Mensal', prazo: '05/06/2025', risco: 'Alto', cor: '#DC3545' },
      { descricao: 'Relatório trimestral de monitoramento de fauna e flora', periodicidade: 'Trimestral', prazo: '20/06/2025', risco: 'Médio', cor: '#FCB316' },
      { descricao: 'Programa contínuo de educação ambiental', periodicidade: 'Contínua', prazo: '30/06/2025', risco: 'Baixo', cor: '#28A745' },
      { descricao: 'Compensação ambiental prevista', periodicidade: 'Única', prazo: '10/05/2025', risco: 'Alto', cor: '#DC3545' },
      { descricao: 'Monitoramento semestral de ruído nos limites', periodicidade: 'Semestral', prazo: '15/06/2025', risco: 'Médio', cor: '#FCB316' },
      { descricao: 'Protocolo de renovação com 120 dias de antecedência', periodicidade: 'Única', prazo: '07/02/2025', risco: 'Alto', cor: '#DC3545' },
    ],
  };
}

// Gera e baixa uma planilha (.csv compatível com Excel) com os dados extraídos.
export function exportExcel(d) {
  const rows = [
    ['Campo', 'Valor'], ['Tipo', d.tipo], ['Sigla', d.sigla], ['Órgão', d.orgao], ['Processo', d.processo],
    ['Validade', d.validade], ['Classificação de risco', d.risco], ['Resumo', d.resumo],
    [], ['Condicionante', 'Periodicidade', 'Prazo', 'Risco'],
    ...d.cond.map((c) => [c.descricao, c.periodicidade, c.prazo, c.risco]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `licenca_${d.sigla}_${d.processo}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
