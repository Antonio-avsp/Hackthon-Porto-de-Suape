// Testa o modo LIMPO (fallback) do gerador de planilha: quando não há template
// válido, gera um workbook do zero com o mesmo layout de colunas.
// Import dinâmico: o env precisa estar setado antes do módulo carregar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';

process.env.SPREADSHEET_TEMPLATE = '/caminho/inexistente-para-forcar-modo-limpo.xlsx';
const { gerarBuffer, REGISTRY_SHEET } = await import('../src/services/spreadsheet.service.js');

test('LIMPO: gera só a aba de registro com as colunas, sem depender do arquivo', async () => {
  const buf = await gerarBuffer({
    licencas: [{ id: 'LO-1', sigla: 'LO', orgao: 'CPRH', numero: '1/2030', processo: '2030.001.PE', validade: '01/01/2032', status: 'andamento', cond: [] }],
  });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.getWorksheet(REGISTRY_SHEET);
  assert.ok(ws, 'aba de registro presente');
  assert.equal(wb.worksheets.length, 1, 'modo limpo gera apenas a aba de registro');
  // o cabeçalho contém TIPO DE LICENCIAMENTO em alguma coluna
  let temHeader = false;
  ws.getRow(2).eachCell({ includeEmpty: false }, (c) => { if (String(c.value).toUpperCase().includes('TIPO DE LICENCIAMENTO')) temHeader = true; });
  assert.ok(temHeader, 'cabeçalho de colunas presente');
});
