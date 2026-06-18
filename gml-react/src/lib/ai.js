// ============================================================
// Helpers locais da Assistente de IA.
// A leitura real de licenças e o chat agora passam pelo backend
// (ver lib/api.js) — a chave da LLM fica no servidor, nunca no navegador.
// Este arquivo mantém apenas utilitários de UI: extração de demonstração
// (modo offline) e exportação para Excel.
// ============================================================

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let exId = 0;

// Extração simulada (modo demonstração, sem backend/arquivo real).
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
