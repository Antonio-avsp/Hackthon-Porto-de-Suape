// ============================================================
// Motor de planilha (.xlsx) da A.L.I.A — Fase 5 (automação).
//
// A planilha é uma PROJEÇÃO da fonte da verdade (não um banco). Gera um .xlsx
// a partir do estado atual, mapeando cada licença para as colunas do controle
// "Licenças e Autorizações" do cliente.
//
// Dois caminhos (escolha por env SPREADSHEET_TEMPLATE):
//  - fillTemplate: carrega o template REAL do cliente, remove a formatação
//    condicional (que o writer do exceljs corromperia) e escreve as linhas —
//    preservando abas, células mescladas e fórmulas (validado empiricamente).
//  - buildFresh:  monta um workbook limpo com o MESMO layout de colunas, sem
//    depender de arquivo (fallback que roda em qualquer ambiente).
//
// O mapeamento é por NOME de cabeçalho (resiliente a mudança de posição de
// coluna). Só preenche colunas derivadas do documento; as internas (área
// demandante, ofício, prazos internos…) ficam em branco por design.
// ============================================================
import ExcelJS from 'exceljs';
import fs from 'node:fs';
import env from '../config/env.js';

export const REGISTRY_SHEET = 'Licenças e Autorizações';

// Cabeçalhos do controle do cliente (linha 2), na ordem das colunas B..AD.
export const REGISTRY_HEADERS = [
  'OBJETO', 'TIPO DE LICENCIAMENTO', 'LOCALIZAÇÃO', 'DESCRIÇÃO DO EMPREENDIMENTO/ OBRA',
  'ÁREA DEMANDANTE', 'N º DA SOLICITAÇÃO SILIA', 'N° DO PROCESSO', 'OFÍCIO SUAPE',
  'DATA DA SOLICITAÇÃO', 'DATA DO PROTOCOLO', 'EXIGÊNCIAS', 'PRAZO PARA CUMPRIMENTO DE EXIGÊNCIA',
  'CUMPRIMENTO', 'EVIDÊNCIA DO CUMPRIMENTO', 'ANDAMENTO', 'STATUS', 'N° DA LICENÇA/AUTORIZAÇÃO',
  'DATA DA EMISSÃO', 'VALIDADE', 'PROCESSO  SEI VINCULADO', 'Nº LICENÇA ANTIGA', 'VALIDADE',
  'RESPONSÁVEL/     PONTO FOCAL', 'REUNIÃO 06/07/2020', 'EXIGÊNCIAS (condicionante)',
  'PROTOCOLO CPRH CUMPRIMENTO DE CONDICIONANTES', 'PRAZO INTERNO PARA PRORROGAÇÃO/RENOVAÇÃO',
  'PRAZO EXTERNO PARA PRORROGAÇÃO/RENOVAÇÃO', 'OBSERVAÇÃO',
];
const FIRST_COL = 2; // coluna B

const STATUS_LABEL = {
  critica: 'Crítica', atencao: 'Atenção', andamento: 'Em andamento',
  concluida: 'Concluída', atrasada: 'Atrasada', pendente: 'Pendente',
};

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const limpo = (v) => (v && v !== '—' ? String(v) : '');

/** Valores a escrever, indexados pelo NOME normalizado do cabeçalho. */
function valoresPorCabecalho(l) {
  const conds = l.cond || [];
  // Listas das condicionantes (mesma ordem) → colunas EXIGÊNCIAS / PRAZO / CUMPRIMENTO.
  const exigencias = conds.map((c) => c.nome).filter(Boolean).join('; ');
  const prazos = conds.map((c) => limpo(c.prazo)).filter(Boolean).join('; ');
  const cumprimento = conds.map((c) => STATUS_LABEL[c.st] || c.st).filter(Boolean).join('; ');
  // Andamento global = média do progresso das condicionantes.
  const andamento = conds.length
    ? Math.round(conds.reduce((a, c) => a + (c.prog || 0), 0) / conds.length) + '%'
    : '';
  // Responsável + ponto focal (área/contratada).
  const responsavel = [limpo(l.resp), limpo(l.respDet)].filter(Boolean).join(' · ');
  // Endereço completo → coluna LOCALIZAÇÃO (endereço · município · CEP).
  const localizacao = [limpo(l.endereco), limpo(l.municipio), l.cep && l.cep !== '—' ? `CEP ${l.cep}` : '']
    .filter(Boolean).join(' · ') || limpo(l.localizacao);
  // CNPJ/CPF e resumo → coluna OBSERVAÇÃO (não há colunas dedicadas).
  const observacao = [
    l.cnpjCpf && l.cnpjCpf !== '—' ? `CNPJ/CPF: ${l.cnpjCpf}` : '',
    l.protocolo && l.protocolo !== '—' ? `Protocolo: ${l.protocolo}` : '',
    limpo(l.resumo),
  ].filter(Boolean).join(' · ') || 'Cadastro automatizado pela A.L.I.A';
  return {
    'objeto': limpo(l.objeto) || l.id || '',
    'tipo de licenciamento': l.sigla || '',
    'localizacao': localizacao,
    'descricao do empreendimento/ obra': limpo(l.descricao) || limpo(l.resumo),
    'n o da solicitacao silia': limpo(l.protocolo),
    'n° do processo': limpo(l.processo),
    'data da solicitacao': limpo(l.dataSolicitacao),
    'data do protocolo': limpo(l.dataProtocolo),
    'exigencias': exigencias,
    'prazo para cumprimento de exigencia': prazos,
    'cumprimento': cumprimento,
    'andamento': andamento,
    'status': STATUS_LABEL[l.status] || l.status || '',
    'n° da licenca/autorizacao': limpo(l.numero) || l.id || '',
    'data da emissao': limpo(l.dataEmissao),
    'validade': limpo(l.validade),
    'responsavel/ ponto focal': responsavel,
    'exigencias (condicionante)': exigencias,
    'observacao': observacao,
  };
}

/** Constrói o índice {cabecalhoNormalizado -> nº da coluna} (1ª ocorrência vence). */
function mapaColunas(ws, headerRow) {
  const mapa = {};
  const row = ws.getRow(headerRow);
  row.eachCell({ includeEmpty: false }, (cell, col) => {
    const key = norm(cell.value);
    if (key && !(key in mapa)) mapa[key] = col;
  });
  return mapa;
}

function escreverLinha(ws, rowIdx, valores, mapa) {
  for (const [headerKey, valor] of Object.entries(valores)) {
    const col = mapa[headerKey];
    if (col && valor !== '' && valor != null) ws.getRow(rowIdx).getCell(col).value = valor;
  }
}

/** Caminho TEMPLATE: carrega o arquivo do cliente e ANEXA as licenças.
 *
 * Segurança (validado empiricamente): (1) removemos a formatação condicional,
 * que o writer do exceljs corromperia (gera arquivo que o Excel pede para
 * "reparar"); (2) NUNCA sobrescrevemos linhas existentes nem deslocamos seções/
 * merges — escrevemos um bloco rotulado APÓS a última linha usada. As demais
 * abas, fórmulas e validações do cliente permanecem intactas. */
async function fillTemplate(licencas, templatePath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  // Remove formatação condicional (o writer do exceljs a corromperia → arquivo inválido).
  for (const ws of wb.worksheets) {
    if (ws.conditionalFormattings) ws.conditionalFormattings = [];
    if (ws.model && ws.model.conditionalFormattings) ws.model.conditionalFormattings = [];
  }
  const ws = wb.getWorksheet(REGISTRY_SHEET) || wb.worksheets[0];
  // Localiza a linha de cabeçalho (a que contém "TIPO DE LICENCIAMENTO").
  let headerRow = 2;
  for (let r = 1; r <= 6; r++) {
    const found = ws.getRow(r).values.some((v) => norm(v) === 'tipo de licenciamento');
    if (found) { headerRow = r; break; }
  }
  const mapa = mapaColunas(ws, headerRow);
  const colObjeto = mapa['objeto'] || FIRST_COL;

  // Última linha com conteúdo na coluna OBJETO (cobre banners de seção e dados).
  let lastData = headerRow;
  const maxScan = Math.min(ws.rowCount || headerRow, 500);
  for (let i = headerRow + 1; i <= maxScan; i++) {
    const v = ws.getRow(i).getCell(colObjeto).value;
    if (v != null && String(v).trim() !== '') lastData = i;
  }

  // Bloco rotulado, APÓS o conteúdo existente (append-only, sem clobber).
  let rowIdx = lastData + 2;
  const banner = ws.getRow(rowIdx);
  banner.getCell(colObjeto).value = `PROCESSOS IMPORTADOS PELA A.L.I.A. — ${new Date().toLocaleDateString('pt-BR')}`;
  banner.getCell(colObjeto).font = { bold: true, color: { argb: 'FF2E60AD' } };
  rowIdx += 1;
  for (const l of licencas) escreverLinha(ws, rowIdx++, valoresPorCabecalho(l), mapa);
  return wb;
}

// Largura (em caracteres) por cabeçalho normalizado — colunas com texto longo
// ficam mais largas para a planilha não sair "cortada". Default p/ as demais.
const COL_WIDTHS = {
  'objeto': 26, 'tipo de licenciamento': 16, 'localizacao': 36,
  'descricao do empreendimento/ obra': 40, 'area demandante': 18,
  'n o da solicitacao silia': 18, 'n° do processo': 18, 'oficio suape': 16,
  'data da solicitacao': 16, 'data do protocolo': 16, 'exigencias': 42,
  'prazo para cumprimento de exigencia': 22, 'cumprimento': 22,
  'evidencia do cumprimento': 22, 'andamento': 13, 'status': 14,
  'n° da licenca/autorizacao': 20, 'data da emissao': 15, 'validade': 14,
  'responsavel/ ponto focal': 24, 'exigencias (condicionante)': 42, 'observacao': 44,
};
const DEFAULT_WIDTH = 16;

/** Caminho LIMPO: monta um workbook do zero com o mesmo layout de colunas. */
function buildFresh(licencas) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'A.L.I.A';
  const ws = wb.addWorksheet(REGISTRY_SHEET, { views: [{ state: 'frozen', ySplit: 2 }] });
  const lastCol = FIRST_COL + REGISTRY_HEADERS.length - 1;

  // Título mesclado sobre TODAS as colunas de dados.
  ws.mergeCells(1, FIRST_COL, 1, lastCol);
  ws.getCell(1, FIRST_COL).value = 'MONITORAMENTO DOS PROCESSOS — Controle de Licenças (gerado pela A.L.I.A)';
  ws.getCell(1, FIRST_COL).font = { bold: true, size: 13 };
  ws.getCell(1, FIRST_COL).alignment = { vertical: 'middle' };
  ws.getRow(1).height = 22;

  // Cabeçalho (linha 2) — largura e altura suficientes p/ exibir o texto inteiro.
  REGISTRY_HEADERS.forEach((h, i) => {
    const col = FIRST_COL + i;
    const cell = ws.getCell(2, col);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E60AD' } };
    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    ws.getColumn(col).width = COL_WIDTHS[norm(h)] || DEFAULT_WIDTH;
  });
  ws.getRow(2).height = 44; // acomoda cabeçalhos de 2 linhas sem cortar

  ws.getCell(3, FIRST_COL).value = 'PROCESSOS EM ANDAMENTO';
  ws.getCell(3, FIRST_COL).font = { bold: true };

  const mapa = mapaColunas(ws, 2);
  let rowIdx = 4;
  for (const l of licencas) {
    escreverLinha(ws, rowIdx, valoresPorCabecalho(l), mapa);
    // Alinhamento das células de dados: quebra de texto e alinhamento ao topo.
    for (let col = FIRST_COL; col <= lastCol; col++) {
      ws.getRow(rowIdx).getCell(col).alignment = { wrapText: true, vertical: 'top' };
    }
    rowIdx += 1;
  }
  return wb;
}

/** Gera o workbook a partir do estado.
 *
 * Por padrão usa o caminho LIMPO (buildFresh): um workbook autorado do zero pelo
 * ExcelJS, que o Excel abre sem pedir "reparo". O caminho TEMPLATE (reescrever o
 * .xlsx real do cliente) é OPT-IN via env SPREADSHEET_TEMPLATE — empiricamente o
 * round-trip do ExcelJS sobre o template do cliente (com drawings/VML/comentários/
 * validações) gera relacionamentos que o Excel considera inválidos e "repara",
 * descartando o conteúdo. Como prioridade é a planilha SAIR PREENCHIDA e abrir
 * sem reparo, o build limpo é o default; quem tiver um template que round-trip
 * corretamente pode habilitá-lo apontando SPREADSHEET_TEMPLATE. */
export async function gerarWorkbook(state = {}) {
  const licencas = state.licencas || [];
  const tpl = env.spreadsheetTemplate; // opt-in explícito (não usa o embarcado por padrão)
  if (tpl && fs.existsSync(tpl)) {
    try { return await fillTemplate(licencas, tpl); }
    catch { /* template ilegível → cai no modo limpo */ }
  }
  return buildFresh(licencas);
}

/** Buffer .xlsx pronto para download/upload. */
export async function gerarBuffer(state = {}) {
  const wb = await gerarWorkbook(state);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export default { gerarWorkbook, gerarBuffer, REGISTRY_HEADERS, REGISTRY_SHEET };
