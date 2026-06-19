// Testes do repositório ambiental (Fase 3) — fonte única de verdade.
// Usa store em memória (ALIA_DATA_FILE=:memory:) para não tocar o disco.
// Import dinâmico: o env precisa estar setado ANTES do módulo carregar
// (imports estáticos são içados e leriam o valor cedo demais).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.ALIA_DATA_FILE = ':memory:';
const repo = (await import('../src/repositories/environmental.repository.js')).default;

beforeEach(() => repo.reset());

test('estado inicial vem do seed', () => {
  const s = repo.getState();
  assert.ok(s.licencas.length >= 8);
  assert.ok(s.demandas.length >= 6);
  assert.ok(s.evidencias.length >= 4);
});

test('getState devolve cópias (imutabilidade externa)', () => {
  const a = repo.getState();
  a.licencas.push({ id: 'HACK' });
  assert.equal(repo.getState().licencas.find((l) => l.id === 'HACK'), undefined);
});

test('addLicenca insere e persiste', () => {
  repo.addLicenca({ id: 'LO-2025-999', sigla: 'LO', orgao: 'CPRH', processo: '2025.999.PE', validade: '01/01/2026', dias: 200, status: 'andamento', cond: [] });
  assert.ok(repo.getState().licencas.some((l) => l.id === 'LO-2025-999'));
});

test('updateLicenca aplica patch; retorna null se ausente', () => {
  const up = repo.updateLicenca('LO-2023-045', { status: 'andamento' });
  assert.equal(up.status, 'andamento');
  assert.equal(repo.updateLicenca('NAO-EXISTE', { x: 1 }), null);
});

test('deleteLicenca remove e informa sucesso/falha', () => {
  assert.equal(repo.deleteLicenca('LP-2024-118'), true);
  assert.equal(repo.getState().licencas.some((l) => l.id === 'LP-2024-118'), false);
  assert.equal(repo.deleteLicenca('LP-2024-118'), false);
});

test('upsertFromExtract cria com id derivado e atualiza no segundo upsert', () => {
  const extract = { sigla: 'LO', orgao: 'CPRH', processo: '2099.123.PE', validade: '10/10/2030', cond: [{ descricao: 'Nova cond', periodicidade: 'Mensal' }] };
  const a = repo.upsertFromExtract(extract);
  assert.equal(a.created, true);
  assert.match(a.license.id, /^LO-/);
  assert.equal(a.license.cond[0].nome, 'Nova cond');
  const b = repo.upsertFromExtract(extract);
  assert.equal(b.created, false); // mesmo processo+sigla → atualiza
});

test('replaceDemandas / replaceEvidencias substituem a coleção', () => {
  repo.replaceDemandas([{ titulo: 'X', orgao: 'CPRH', resp: '—', prazo: '—', prio: 'Alta', status: 'pendente' }]);
  assert.equal(repo.getState().demandas.length, 1);
  repo.replaceEvidencias([]);
  assert.equal(repo.getState().evidencias.length, 0);
});
