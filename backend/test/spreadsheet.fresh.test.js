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

test('LIMPO: preenche solicitação, datas, exigências, prazo e cumprimento', async () => {
  const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const buf = await gerarBuffer({
    licencas: [{
      id: 'AUT-1', sigla: 'AUT', orgao: 'CPRH', numero: '1708/2025', processo: '1708.PE',
      protocolo: '002491-3', dataSolicitacao: '10/03/2025', dataProtocolo: '12/03/2025',
      validade: '24/04/2026', status: 'andamento', resp: 'Equipes internas', respDet: 'Meio Ambiente',
      cond: [
        { nome: 'Monitoramento de fauna', per: 'Mensal', prazo: '05/06/2025', risco: 'Alto', prog: 40, st: 'andamento' },
        { nome: 'Relatório trimestral', per: 'Trimestral', prazo: '20/06/2025', risco: 'Médio', prog: 100, st: 'concluida' },
      ],
    }],
  });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.getWorksheet(REGISTRY_SHEET);
  const map = {};
  ws.getRow(2).eachCell({ includeEmpty: false }, (c, col) => { const k = norm(c.value); if (k && !(k in map)) map[k] = col; });
  let linha = null;
  ws.eachRow((row, r) => row.eachCell((c) => { if (String(c.value).includes('1708.PE')) linha = linha || r; }));
  assert.ok(linha, 'linha importada presente');
  const val = (h) => String(ws.getRow(linha).getCell(map[norm(h)]).value || '');
  assert.equal(val('N º DA SOLICITAÇÃO SILIA'), '002491-3');
  assert.equal(val('DATA DA SOLICITAÇÃO'), '10/03/2025');
  assert.equal(val('DATA DO PROTOCOLO'), '12/03/2025');
  assert.match(val('EXIGÊNCIAS'), /Monitoramento de fauna; Relatório trimestral/);
  assert.match(val('PRAZO PARA CUMPRIMENTO DE EXIGÊNCIA'), /05\/06\/2025; 20\/06\/2025/);
  assert.match(val('CUMPRIMENTO'), /Em andamento; Concluída/);
  assert.equal(val('ANDAMENTO'), '70%');
  assert.match(val('RESPONSÁVEL/     PONTO FOCAL'), /Equipes internas · Meio Ambiente/);
});
