// Testes da camada determinística de intenção (sem rede, sem LLM).
// Espelha tests/test_intent.py do backend do Banco do Brasil.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analisar, classificar, norm, extrairEntidades } from '../src/services/intent.service.js';

test('norm remove acentos e baixa caixa', () => {
  assert.equal(norm('Órgão CPRH — Condicionante'), 'orgao cprh — condicionante');
});

test('saudação pura', () => {
  assert.equal(classificar('Bom dia'), 'saudacao');
  assert.equal(classificar('Oi, tudo bem?'), 'saudacao');
});

test('capacidades', () => {
  assert.equal(classificar('o que você pode fazer?'), 'capacidades');
  assert.equal(classificar('quem é você?'), 'capacidades');
});

test('fora de escopo', () => {
  assert.equal(classificar('me conte uma piada'), 'fora_escopo');
});

test('ação destrutiva é bloqueada', () => {
  assert.equal(classificar('exclua a licença LO-2023-045'), 'acao_destrutiva');
  assert.equal(classificar('apague essa condicionante'), 'acao_destrutiva');
});

test('licenças vencendo + extração de dias', () => {
  const a = analisar('Quais licenças vencem nos próximos 30 dias?');
  assert.equal(a.intencao, 'licencas_vencendo');
  assert.equal(a.entidades.dias, 30);
});

test('licenças vencidas', () => {
  assert.equal(classificar('Quais licenças estão vencidas?'), 'licencas_vencidas');
});

test('licenças por órgão', () => {
  assert.equal(classificar('Quais órgãos emitiram mais licenças?'), 'licencas_por_orgao');
});

test('condicionantes atrasadas', () => {
  assert.equal(classificar('Quais condicionantes estão atrasadas?'), 'condicionantes_atrasadas');
});

test('condicionantes este mês', () => {
  assert.equal(classificar('Quais condicionantes vencem este mês?'), 'condicionantes_mes');
});

test('licença com mais condicionantes', () => {
  assert.equal(classificar('Qual licença possui mais condicionantes pendentes?'), 'licenca_mais_condicionantes');
});

test('consulta de evidência', () => {
  const a = analisar('Quais as coordenadas da evidência da licença LO-2023-045?');
  assert.equal(a.intencao, 'evidencia_consulta');
  assert.equal(a.entidades.licencaId, 'LO-2023-045');
});

test('demandas críticas', () => {
  assert.equal(classificar('Quais demandas críticas estão abertas?'), 'demandas_criticas');
});

test('responsáveis com mais pendências', () => {
  assert.equal(classificar('Quais responsáveis possuem mais pendências?'), 'responsavel_pendencias');
});

test('intenções analíticas', () => {
  assert.equal(classificar('Gere um resumo executivo ambiental'), 'resumo_executivo');
  assert.equal(classificar('Gere um relatório de conformidade'), 'relatorio_conformidade');
  assert.equal(classificar('Gere um plano de ação para as pendências'), 'plano_acao');
});

test('extração de entidades (órgão, sigla, id)', () => {
  const e = extrairEntidades('licença LO da CPRH processo LO-2023-045');
  assert.equal(e.orgao, 'cprh');
  assert.equal(e.sigla, 'lo');
  assert.equal(e.licencaId, 'LO-2023-045');
});

test('pergunta aberta cai no fallback geral', () => {
  assert.equal(classificar('Como melhorar minha gestão ambiental no porto?'), 'pergunta_geral');
});
