// ============================================================
// Classificação de intenção e extração de entidades das mensagens.
//
// Camada DETERMINÍSTICA (sem LLM) que roda ANTES de gerar a resposta da IA —
// espelha a arquitetura do Consultor IA do Banco do Brasil (app/services/
// intent.py), adaptada ao domínio de gestão ambiental do Porto de Suape.
//
// Decide o TIPO da mensagem (saudação, capacidades, ação destrutiva, fora de
// escopo, consultas operacionais sobre licenças/condicionantes/evidências/
// demandas e pedidos analíticos como resumo executivo/relatório/plano de ação)
// e extrai as entidades citadas (período em dias, mês, órgão, sigla, id de
// licença).
//
// Ser determinístico aqui é proposital: é confiável, testável, gratuito e
// rápido, e evita gastar a cota do modelo (e gerar texto desnecessário) com
// saudações, recusas e perguntas sobre capacidades.
// ============================================================

/** minúsculas + sem acentos, para casar marcadores de forma robusta. */
export function norm(texto) {
  return (texto || '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, ''); // remove marcas diacríticas combinantes
}

// --- Meses (nomes completos + abreviações de 3 letras) ---
const MESES = {
  janeiro: 1, jan: 1, fevereiro: 2, fev: 2, marco: 3, mar: 3, abril: 4, abr: 4,
  maio: 5, mai: 5, junho: 6, jun: 6, julho: 7, jul: 7, agosto: 8, ago: 8,
  setembro: 9, set: 9, outubro: 10, out: 10, novembro: 11, nov: 11, dezembro: 12, dez: 12,
};
const NOME_MES = {
  1: 'janeiro', 2: 'fevereiro', 3: 'março', 4: 'abril', 5: 'maio', 6: 'junho',
  7: 'julho', 8: 'agosto', 9: 'setembro', 10: 'outubro', 11: 'novembro', 12: 'dezembro',
};
// Nome completo antes da abreviação (\b evita casar "mai" dentro de "mais").
const MES_RE = new RegExp(
  '\\b(' + Object.keys(MESES).sort((a, b) => b.length - a.length).join('|') + ')\\b',
);

// --- Órgãos ambientais reconhecidos no domínio de Suape ---
const ORGAOS = ['cprh', 'ibama', 'apac', 'ana', 'mpf', 'mppe', 'prefeitura', 'icmbio', 'funai', 'iphan'];

// --- Siglas de licença válidas (espelha o frontend/data.js) ---
const SIGLAS = ['aut', 'lp', 'li', 'lo', 'rlo', 'pli', 'cp', 'ls'];

const LICENCA_ID_RE = /\b([a-z]{2,3}-\d{4}-\d{3})\b/i;

/** Extrai o número de dias citado ("próximos 30 dias", "em 7 dias"). */
export function extrairDias(n) {
  const m = n.match(/(\d{1,3})\s*dias?/);
  return m ? parseInt(m[1], 10) : null;
}

/** Extrai o primeiro mês citado como {ano|null, mes}. */
export function extrairMes(n) {
  const m = MES_RE.exec(n);
  if (!m) return null;
  const mes = MESES[m[1]];
  const janela = n.slice(m.index + m[0].length, m.index + m[0].length + 8);
  const ano = (janela.match(/\b(20\d{2})\b/) || [])[1];
  return { ano: ano ? parseInt(ano, 10) : null, mes };
}

/** Rótulo amigável de um mês ("2025-06" → "junho de 2025"). */
export function labelMes(ano, mes) {
  return `${NOME_MES[mes]}${ano ? ' de ' + ano : ''}`;
}

/** Extrai as entidades de domínio citadas na mensagem. */
export function extrairEntidades(texto) {
  const n = norm(texto);
  const idMatch = texto.match(LICENCA_ID_RE);
  return {
    dias: extrairDias(n),
    mes: extrairMes(n),
    esteMes: /\beste m[eê]s\b|\bneste m[eê]s\b|\bdo m[eê]s\b/.test(n),
    orgao: ORGAOS.find((o) => new RegExp(`\\b${o}\\b`).test(n)) || null,
    sigla: SIGLAS.find((s) => new RegExp(`\\b${s}\\b`).test(n)) || null,
    licencaId: idMatch ? idMatch[1].toUpperCase() : null,
  };
}

// --- Hints de classificação ---
const SAUDACOES = ['bom dia', 'boa tarde', 'boa noite', 'ola tudo bem', 'ola', 'oi', 'e ai', 'hello', 'hi', 'hey', 'tudo bem', 'como vai'];

const CAPACIDADES_HINTS = [
  'o que voce pode', 'o que voce faz', 'como voce pode me ajudar', 'no que voce',
  'para que voce serve', 'quais suas funcoes', 'quais sao suas funcoes', 'o que voce consegue',
  'como voce funciona', 'o que da pra fazer', 'como pode me ajudar', 'o que voce sabe fazer',
  'me ajudar com o que', 'quais recursos', 'quem e voce', 'o que e a alia',
];

// Fora de escopo: lista CONSERVADORA de termos claramente não-ambientais.
// (Evita termos ambíguos; casos duvidosos seguem para o caminho com contexto,
//  onde o próprio modelo redireciona com segurança.)
const FORA_ESCOPO_HINTS = [
  'explosiv', 'bomba caseira', 'arma de fogo', 'poema', 'piada', 'futebol',
  'receita de bolo', 'como cozinhar', 'letra de musica', 'namoro', 'horoscopo',
  'bitcoin', 'cotacao do dolar', 'campeonato',
];

// Ação destrutiva: VERBO imperativo de alteração + OBJETO do sistema. Assim
// "exclua a licença X" é bloqueado, mas "quais licenças estão vencidas?"
// (sem verbo de ação) segue para a consulta normal.
const VERBO_DESTRUTIVO = /\b(exclu\w+|apag\w+|delet\w+|remov\w+|alter\w+|edit\w+|modific\w+|aprov\w+|protocol\w+|envi[ae]\w*)\b/;
const OBJ_SISTEMA = /\b(licenc\w*|condicionante\w*|cadastro|demanda\w*|evidencia\w*|registro\w*)\b/;

function temAlgum(n, lista) {
  return lista.some((p) => n.includes(p));
}

function ehSaudacaoPura(n) {
  const limpo = n.replace(/[^\w\s]/g, ' ');
  if (!SAUDACOES.some((s) => limpo.includes(s))) return false;
  let resto = limpo;
  for (const s of [...SAUDACOES].sort((a, b) => b.length - a.length)) resto = resto.split(s).join(' ');
  resto = resto.replace(/\b(tudo|bem|ai|e|td|blz|por|favor|pf|entao|ok|alia|ia|assistente)\b/g, ' ');
  const palavras = resto.split(/\s+/).filter((w) => w.length > 1);
  return palavras.length <= 1;
}

/**
 * Classifica a intenção da mensagem. A ordem importa (primeira que casa vence) —
 * intenções específicas/operacionais antes das genéricas.
 */
export function classificar(texto) {
  const n = norm(texto);

  // 1) Diretas (não tocam dados nem modelo)
  if (VERBO_DESTRUTIVO.test(n) && OBJ_SISTEMA.test(n)) return 'acao_destrutiva';
  if (temAlgum(n, CAPACIDADES_HINTS)) return 'capacidades';
  if (temAlgum(n, FORA_ESCOPO_HINTS)) return 'fora_escopo';
  if (ehSaudacaoPura(n)) return 'saudacao';

  const temLicenca = /\blicenc/.test(n);
  const temCond = /\bcondicionante/.test(n);
  const temEvid = /\bevidencia/.test(n);
  const temDemanda = /\bdemanda/.test(n);

  // 2) Analíticas/generativas (LLM com fallback determinístico) — checadas antes
  //    das operacionais para "resumo/relatório/plano" não serem capturados por
  //    palavras como "licença".
  if (/plano de aca?o/.test(n)) return 'plano_acao';
  if (/relatorio.*conformidade|conformidade.*relatorio|relatorio de conformidade/.test(n)) return 'relatorio_conformidade';
  if (/resumo executivo|panorama|visao geral|status geral|resumo (ambiental|geral|da operacao)/.test(n)) return 'resumo_executivo';

  // 3) Evidências (coordenadas, data, hora, local)
  if (temEvid || /\b(coordenada|latitude|longitude|georreferenc|onde foi|onde fica|local da)\b/.test(n)) {
    return 'evidencia_consulta';
  }

  // 4) Licenças
  if (temLicenca && /\b(vencid\w+|expirad\w+|venceu|ja venceu)\b/.test(n)) return 'licencas_vencidas';
  if (temLicenca && /\b(vence\w*|vencer|vencimento|expir\w+|a vencer)\b/.test(n)) return 'licencas_vencendo';
  if (/\borgao/.test(n) && /(mais|emitiu|emitir\w*|quant\w+)/.test(n)) return 'licencas_por_orgao';
  if (/quais orgaos/.test(n)) return 'licencas_por_orgao';

  // 5) Condicionantes
  if (temCond && /\b(atrasad\w+|vencid\w+|atraso|em atraso)\b/.test(n)) return 'condicionantes_atrasadas';
  if (temCond && /(sem evidencia|falta\w* evidencia|sem comprov)/.test(n)) return 'condicionantes_sem_evidencia';
  if (temCond && /(sem protocolo|protocolo.*pendente|nao protocol)/.test(n)) return 'condicionantes_sem_protocolo';
  if (temLicenca && temCond && /(mais condicionante|mais pendente)/.test(n)) return 'licenca_mais_condicionantes';
  if (temCond && /\b(vence\w*|vencer|prazo|este m[eê]s|pendente\w*)\b/.test(n)) return 'condicionantes_mes';
  if (temCond) return 'condicionantes_mes';

  // 6) Demandas / responsáveis
  if (temDemanda) return 'demandas_criticas';
  if (/\bquem\b|responsavel|responsaveis/.test(n) && /(mais|pendencia\w*|pendente\w*|aberto\w*)/.test(n)) {
    return 'responsavel_pendencias';
  }
  if (/\bquem\b.*(respons|responde)|responsavel pela|responsavel da/.test(n)) return 'responsavel_consulta';

  // 7) Fallback → pergunta aberta respondida pelo LLM com contexto real
  return 'pergunta_geral';
}

// Intenções que NÃO dependem de dados nem do modelo (respostas diretas).
export const INTENCOES_DIRETAS = new Set(['saudacao', 'capacidades', 'fora_escopo', 'acao_destrutiva']);

// Intenções respondidas de forma EXATA a partir dos dados reais (sem modelo).
export const INTENCOES_OPERACIONAIS = new Set([
  'licencas_vencendo', 'licencas_vencidas', 'licencas_por_orgao',
  'condicionantes_atrasadas', 'condicionantes_sem_evidencia', 'condicionantes_sem_protocolo',
  'condicionantes_mes', 'licenca_mais_condicionantes',
  'demandas_criticas', 'responsavel_pendencias', 'responsavel_consulta',
  'evidencia_consulta',
]);

// Intenções analíticas/generativas (LLM com contexto, fallback determinístico).
export const INTENCOES_ANALITICAS = new Set([
  'resumo_executivo', 'relatorio_conformidade', 'plano_acao', 'pergunta_geral',
]);

/** Conveniência: classifica e extrai entidades numa única chamada. */
export function analisar(texto) {
  return { intencao: classificar(texto), entidades: extrairEntidades(texto) };
}

export default { norm, analisar, classificar, extrairEntidades, labelMes, INTENCOES_DIRETAS, INTENCOES_OPERACIONAIS, INTENCOES_ANALITICAS };
