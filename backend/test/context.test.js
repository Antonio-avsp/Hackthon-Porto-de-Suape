// Testes do contexto ambiental + respostas determinísticas (sem rede, sem LLM).
// Espelha tests/test_dashboard_metricas.py / test_metas_ia.py do backend do BB.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { snapshot, flattenCondicionantes, scoreConformidade } from '../src/services/environmentalContext.service.js';
import { respostaOperacional, fallbackAnalitico, respostaDireta } from '../src/services/deterministicAnswers.service.js';

// Estado mínimo de demonstração, com referência fixa para resultados estáveis.
const ESTADO = {
  licencas: [
    { id: 'LO-2023-045', sigla: 'LO', orgao: 'CPRH', processo: '2023.045.PE', validade: '07/06/2025', dias: 7, status: 'critica', resp: 'Equipes internas', respDet: 'Meio Ambiente', cond: [
      { nome: 'Monitoramento de efluentes', per: 'Mensal', prog: 62, st: 'andamento' },
      { nome: 'Renovação da LO (protocolo)', per: 'Única', prog: 30, st: 'critica' },
    ] },
    { id: 'LI-2023-090', sigla: 'LI', orgao: 'IBAMA', processo: '2023.090.PE', validade: '30/09/2025', dias: 120, status: 'andamento', resp: 'Contratadas', respDet: 'Bioterra', cond: [
      { nome: 'Relatório de fauna', per: 'Trimestral', prog: 100, st: 'concluida' },
    ] },
    { id: 'AUT-2024-031', sigla: 'AUT', orgao: 'IBAMA', processo: '2024.031.PE', validade: '01/01/2025', dias: -30, status: 'critica', resp: 'Áreas internas', respDet: 'Financeiro', cond: [
      { nome: 'Compensação ambiental', per: 'Única', prog: 40, st: 'atrasada' },
    ] },
  ],
  demandas: [
    { titulo: 'Esclarecimento sobre efluentes', orgao: 'CPRH', resp: 'Jurídico', prazo: '15/06/2025', prio: 'Urgente', status: 'andamento' },
    { titulo: 'Protocolo renovação LO', orgao: 'CPRH', resp: 'Jurídico', prazo: '07/02/2025', prio: 'Alta', status: 'concluida' },
  ],
  evidencias: [
    { nome: 'Ponto de coleta — Rio Tatuoca', tipo: 'Foto de campo', lic: 'LO-2023-045', cond: 'Monitoramento de efluentes', resp: 'J. Silva', data: '12/05/2025', hora: '09:41', lat: -8.3956, lng: -34.9712 },
  ],
};
const REF = '12/06/2025';

test('snapshot calcula KPIs corretos', () => {
  const snap = snapshot(ESTADO, REF);
  assert.equal(snap.kpis.licencas_total, 3);
  assert.equal(snap.kpis.licencas_vencendo_30d, 1); // LO em 7 dias
  assert.equal(snap.kpis.licencas_vencidas, 1); // AUT há 30 dias
  assert.equal(snap.kpis.condicionantes_total, 4);
  assert.equal(snap.kpis.condicionantes_atrasadas, 2); // critica + atrasada
  assert.equal(snap.kpis.evidencias_total, 1);
  assert.deepEqual(snap.kpis.orgaos_emissores, { CPRH: 1, IBAMA: 2 });
});

test('flattenCondicionantes vincula evidência por nome', () => {
  const conds = flattenCondicionantes(ESTADO.licencas, ESTADO.evidencias);
  const efl = conds.find((c) => c.nome === 'Monitoramento de efluentes');
  assert.equal(efl.temEvidencia, true);
  const comp = conds.find((c) => c.nome === 'Compensação ambiental');
  assert.equal(comp.temEvidencia, false);
});

test('score de conformidade fica entre 0 e 100 e decompõe em 4 fatores', () => {
  const snap = snapshot(ESTADO, REF);
  const s = snap.score;
  assert.ok(s.valor >= 0 && s.valor <= 100);
  assert.ok(['saudável', 'atenção', 'crítica'].includes(s.saude));
  assert.equal(Object.keys(s.componentes).length, 4);
});

test('resposta operacional: licenças vencendo cita a licença real', () => {
  const snap = snapshot(ESTADO, REF);
  const out = respostaOperacional('licencas_vencendo', { dias: 30 }, snap);
  assert.match(out.resposta, /LO-2023-045/);
  assert.equal(out.fonte, 'deterministico');
});

test('resposta operacional: licença com mais condicionantes pendentes', () => {
  const snap = snapshot(ESTADO, REF);
  const out = respostaOperacional('licenca_mais_condicionantes', {}, snap);
  assert.match(out.resposta, /LO-2023-045/); // 2 pendentes
});

test('resposta operacional: evidência por licença traz coordenadas', () => {
  const snap = snapshot(ESTADO, REF);
  const out = respostaOperacional('evidencia_consulta', { licencaId: 'LO-2023-045' }, snap);
  assert.match(out.resposta, /-8\.3956/);
  assert.match(out.resposta, /09:41/);
});

test('fallback analítico: plano de ação prioriza vencidas e atrasadas', () => {
  const snap = snapshot(ESTADO, REF);
  const out = fallbackAnalitico('plano_acao', snap);
  assert.match(out.resposta, /AUT-2024-031/); // vencida
  assert.match(out.resposta, /\[ALTA\]/);
});

test('resposta direta não depende de dados', () => {
  assert.match(respostaDireta('saudacao').resposta, /A\.L\.I\.A/);
  assert.equal(respostaDireta('pergunta_geral'), null);
});
