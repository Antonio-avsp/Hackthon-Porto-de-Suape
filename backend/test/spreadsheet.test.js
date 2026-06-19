// Testes da geração da Planilha de Controle (.xlsx) — modo TEMPLATE (padrão).
// Lê o resultado de volta com exceljs e valida o mapeamento por cabeçalho e a
// preservação dos dados/abas do cliente. (Sem rede; usa o template embarcado.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { gerarBuffer, REGISTRY_SHEET } from '../src/services/spreadsheet.service.js';

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const STATE = {
  licencas: [
    { id: 'LO-2099-500', sigla: 'LO', orgao: 'CPRH', numero: '500/2099', processo: '2099.500.PE', dataEmissao: '01/02/2099', validade: '10/10/2099', objeto: 'Teste IA', status: 'andamento', resp: 'Equipes internas', cond: [{ nome: 'Cond X' }] },
  ],
};

async function load(buf) { const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf); return wb; }

function headerMap(ws) {
  for (let r = 1; r <= 6; r++) {
    const map = {}; let achou = false;
    ws.getRow(r).eachCell({ includeEmpty: false }, (c, col) => {
      const k = norm(c.value);
      if (k && !(k in map)) map[k] = col; // 1ª ocorrência vence (há 2 colunas "VALIDADE")
      if (k === 'tipo de licenciamento') achou = true;
    });
    if (achou) return { row: r, map };
  }
  return null;
}

function acharLinha(ws, txt) {
  let found = null;
  ws.eachRow((row, r) => row.eachCell({ includeEmpty: false }, (c) => { if (String(c.value).includes(txt)) found = found || r; }));
  return found;
}

test('TEMPLATE: licença importada cai nas colunas certas (por cabeçalho)', async () => {
  const wb = await load(await gerarBuffer(STATE));
  const ws = wb.getWorksheet(REGISTRY_SHEET);
  assert.ok(ws, 'aba de registro presente');
  const hm = headerMap(ws);
  assert.ok(hm, 'cabeçalho localizado');
  const linha = acharLinha(ws, '2099.500.PE');
  assert.ok(linha, 'linha importada presente');
  const val = (h) => ws.getRow(linha).getCell(hm.map[norm(h)]).value;
  assert.equal(val('TIPO DE LICENCIAMENTO'), 'LO');
  assert.equal(val('N° DA LICENÇA/AUTORIZAÇÃO'), '500/2099');
  assert.equal(val('DATA DA EMISSÃO'), '01/02/2099');
  assert.equal(val('VALIDADE'), '10/10/2099');
});

test('TEMPLATE: preserva dados do cliente (Jazida) e as 5 abas', async () => {
  const wb = await load(await gerarBuffer(STATE));
  assert.ok(wb.worksheets.length >= 5, 'mantém as abas do cliente');
  const ws = wb.getWorksheet(REGISTRY_SHEET);
  assert.ok(acharLinha(ws, 'Jazida'), 'linha original do cliente preservada (não sobrescrita)');
});

test('TEMPLATE: bloco rotulado da A.L.I.A. é adicionado', async () => {
  const wb = await load(await gerarBuffer(STATE));
  const ws = wb.getWorksheet(REGISTRY_SHEET);
  assert.ok(acharLinha(ws, 'IMPORTADOS PELA A.L.I.A'), 'banner do bloco importado presente');
});
