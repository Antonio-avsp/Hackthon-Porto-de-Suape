// Testes da validação/normalização da extração de licenças (Fase 4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAndNormalizeLicense, normalizeDate, normalizeOrgao, normalizePeriodicidade } from '../src/models/licenseValidation.js';

test('normalizeDate aceita formatos comuns e padroniza DD/MM/AAAA', () => {
  assert.equal(normalizeDate('2025-06-07').value, '07/06/2025');
  assert.equal(normalizeDate('7/6/2025').value, '07/06/2025');
  assert.equal(normalizeDate('07.06.2025').value, '07/06/2025');
  assert.equal(normalizeDate('31/02/2025').valid, false); // data impossível
  assert.equal(normalizeDate('—').valid, false);
});

test('normalizeOrgao reconhece grafias com/sem acento', () => {
  assert.deepEqual(normalizeOrgao('cprh'), { value: 'CPRH', known: true });
  assert.equal(normalizeOrgao('Prefeitura').value, 'Prefeitura');
  assert.equal(normalizeOrgao('Órgão Desconhecido').known, false);
});

test('normalizePeriodicidade mapeia para o conjunto canônico', () => {
  assert.equal(normalizePeriodicidade('mensal').value, 'Mensal');
  assert.equal(normalizePeriodicidade('TRIMESTRAL').value, 'Trimestral');
  assert.equal(normalizePeriodicidade('quando der').known, false);
});

test('valida licença coerente sem avisos', () => {
  const { validacao } = validateAndNormalizeLicense({
    sigla: 'LO', tipo: 'Licença de Operação', orgao: 'CPRH', processo: '2023.045.PE',
    validade: '07/06/2030', risco: 'Alto', resumo: 'ok',
    cond: [{ descricao: 'Monitoramento', periodicidade: 'Mensal', prazo: '01/01/2030', risco: 'Alto' }],
  });
  assert.equal(validacao.ok, true);
  assert.equal(validacao.avisos.length, 0);
});

test('sinaliza data inválida, órgão desconhecido e processo fora do formato', () => {
  const { license, validacao } = validateAndNormalizeLicense({
    sigla: 'LO', tipo: 'LO', orgao: 'SecretariaX', processo: 'ABC',
    validade: '99/99/2025', risco: 'Alto', resumo: '—', cond: [],
  });
  assert.equal(validacao.ok, false);
  assert.equal(license.validade, '—');
  assert.ok(validacao.avisos.some((a) => /processo/i.test(a)));
  assert.ok(validacao.avisos.some((a) => /[óo]rg[ãa]o/i.test(a)));
});

test('coerência: validade passada gera aviso de vencida (ref 12/06/2025)', () => {
  const { validacao } = validateAndNormalizeLicense({
    sigla: 'LO', tipo: 'LO', orgao: 'CPRH', processo: '2023.045.PE',
    validade: '01/01/2025', risco: 'Alto', resumo: 'x', cond: [],
  });
  assert.ok(validacao.avisos.some((a) => /vencida/i.test(a)));
});

test('sigla inválida cai para LO com aviso', () => {
  const { license, validacao } = validateAndNormalizeLicense({ sigla: 'XX', tipo: 'x', orgao: 'CPRH', processo: '2023.045.PE', validade: '07/06/2030', risco: 'Alto', cond: [] });
  assert.equal(license.sigla, 'LO');
  assert.ok(validacao.avisos.some((a) => /sigla/i.test(a)));
});
