// ============================================================
// Contexto ambiental — fonte única de verdade para a inteligência da A.L.I.A.
//
// Espelha o app/services/finance_context.py do Banco do Brasil: consolida o
// estado operacional (licenças, condicionantes, demandas, evidências) num
// snapshot com indicadores/KPIs e monta o CONTEXTO estruturado e escopado que
// será injetado no prompt do modelo — nunca RAG vetorial, sempre dado real.
//
// O estado de domínio chega do frontend a cada requisição (lá o usuário cria/
// edita licenças, registra evidências, etc.). TODA a derivação de indicadores
// e contexto, porém, acontece aqui no servidor — concentrando a "inteligência"
// no backend, como na arquitetura do BB.
// ============================================================

const SIGLA_NOME = {
  AUT: 'Autorização Ambiental', LP: 'Licença Prévia', LI: 'Licença de Instalação',
  LO: 'Licença de Operação', RLO: 'Renovação da LO', PLI: 'Prorrogação da LI',
  CP: 'Consulta Prévia', LS: 'Licença Simplificada',
};
export const tipoNome = (s) => SIGLA_NOME[s] || s;

const ST_LABEL = {
  concluida: 'Concluída', andamento: 'Em andamento', atencao: 'Atenção',
  atrasada: 'Atrasada', critica: 'Crítica', pendente: 'Pendente',
};

// --- Datas ----------------------------------------------------------------
/** Converte "DD/MM/AAAA" em Date (meia-noite local). Tolera entrada inválida. */
export function parseValidade(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(str || '').trim());
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

/** Data de referência: usa a recebida (ISO ou DD/MM/AAAA) ou a de hoje. */
export function resolveRefDate(refDate) {
  if (refDate instanceof Date) return refDate;
  if (typeof refDate === 'string') {
    const br = parseValidade(refDate);
    if (br) return br;
    const iso = new Date(refDate);
    if (!Number.isNaN(iso.getTime())) return iso;
  }
  return new Date();
}

/** Dias até o vencimento de uma licença (usa `dias` quando presente). */
export function diasAteVencimento(lic, ref) {
  if (Number.isFinite(lic?.dias)) return lic.dias;
  const dt = parseValidade(lic?.validade);
  if (!dt) return null;
  return Math.round((dt - ref) / 86400000);
}

const ATRASADAS = new Set(['atrasada', 'critica']);

// --- Condicionantes -------------------------------------------------------
/** Uma evidência "cobre" uma condicionante quando referencia o seu nome. */
function temEvidenciaPara(cond, evidencias) {
  const alvo = (cond.nome || '').toLowerCase();
  return evidencias.some((e) => {
    const ec = (e.cond || '').toLowerCase();
    return (ec && alvo && (ec.includes(alvo) || alvo.includes(ec)));
  });
}

/** Achata as condicionantes de todas as licenças num modelo rico e auditável. */
export function flattenCondicionantes(licencas = [], evidencias = []) {
  const out = [];
  let n = 0;
  for (const l of licencas) {
    for (const c of l.cond || []) {
      n += 1;
      const evidencia = temEvidenciaPara(c, evidencias);
      const protocolo = c.st === 'concluida' || (c.prog || 0) >= 80;
      out.push({
        numero: `COND-${String(n).padStart(3, '0')}`,
        nome: c.nome,
        licenca: l.id,
        sigla: l.sigla,
        orgao: l.orgao,
        resp: (l.resp || '') + (l.respDet ? ' · ' + l.respDet : ''),
        periodicidade: c.per,
        prog: c.prog || 0,
        st: c.st,
        statusLabel: ST_LABEL[c.st] || c.st,
        temEvidencia: evidencia,
        temProtocolo: protocolo,
      });
    }
  }
  return out;
}

// --- Snapshot consolidado (indicadores + KPIs) ----------------------------
/**
 * Consolida o estado num snapshot com indicadores. É a base para o contexto do
 * modelo e para as respostas determinísticas.
 */
export function snapshot(estado = {}, refDate) {
  const ref = resolveRefDate(refDate);
  const licencas = (estado.licencas || []).map((l) => ({ ...l, _dias: diasAteVencimento(l, ref) }));
  const demandas = estado.demandas || [];
  const evidencias = estado.evidencias || [];
  const conds = flattenCondicionantes(licencas, evidencias);

  const vencendo30 = licencas.filter((l) => l._dias != null && l._dias >= 0 && l._dias <= 30);
  const vencidas = licencas.filter((l) => l._dias != null && l._dias < 0);
  const condAtrasadas = conds.filter((c) => ATRASADAS.has(c.st));
  const condSemEvidencia = conds.filter((c) => !c.temEvidencia);
  const condSemProtocolo = conds.filter((c) => !c.temProtocolo);
  const condConcluidas = conds.filter((c) => c.st === 'concluida');
  const demandasAbertas = demandas.filter((d) => d.status !== 'concluida');
  const demandasCriticas = demandas.filter(
    (d) => d.status !== 'concluida' && /urgente|alta|atrasad/i.test(`${d.prio} ${d.status}`),
  );

  // Licenças por órgão (quantas cada órgão emitiu).
  const porOrgao = {};
  for (const l of licencas) porOrgao[l.orgao] = (porOrgao[l.orgao] || 0) + 1;

  const kpis = {
    licencas_total: licencas.length,
    licencas_vencendo_30d: vencendo30.length,
    licencas_vencidas: vencidas.length,
    condicionantes_total: conds.length,
    condicionantes_atrasadas: condAtrasadas.length,
    condicionantes_sem_evidencia: condSemEvidencia.length,
    condicionantes_sem_protocolo: condSemProtocolo.length,
    condicionantes_concluidas: condConcluidas.length,
    demandas_abertas: demandasAbertas.length,
    demandas_criticas: demandasCriticas.length,
    evidencias_total: evidencias.length,
    orgaos_emissores: porOrgao,
  };

  return {
    refDate: ref,
    licencas, demandas, evidencias, conds,
    vencendo30, vencidas, condAtrasadas, condSemEvidencia, condSemProtocolo,
    condConcluidas, demandasAbertas, demandasCriticas, porOrgao,
    kpis,
    score: scoreConformidade(kpis),
  };
}

/**
 * Score de conformidade ambiental (0–100) decomposto em 4 componentes —
 * espelha o score_detalhado do BB. Quanto maior, mais saudável a operação.
 */
export function scoreConformidade(kpis) {
  const totalCond = Math.max(kpis.condicionantes_total, 1);
  const totalLic = Math.max(kpis.licencas_total, 1);

  const emDia = Math.round(100 * (1 - kpis.condicionantes_atrasadas / totalCond));
  const evidenciado = Math.round(100 * (1 - kpis.condicionantes_sem_evidencia / totalCond));
  const protocolado = Math.round(100 * (1 - kpis.condicionantes_sem_protocolo / totalCond));
  const licencasValidas = Math.round(100 * (1 - kpis.licencas_vencidas / totalLic));

  const clamp = (v) => Math.max(0, Math.min(100, v));
  const componentes = {
    condicionantes_em_dia: clamp(emDia),
    evidencias_cobertas: clamp(evidenciado),
    protocolos_enviados: clamp(protocolado),
    licencas_validas: clamp(licencasValidas),
  };
  const geral = Math.round(
    (componentes.condicionantes_em_dia + componentes.evidencias_cobertas +
      componentes.protocolos_enviados + componentes.licencas_validas) / 4,
  );
  const saude = geral >= 75 ? 'saudável' : geral >= 50 ? 'atenção' : 'crítica';
  return { valor: geral, saude, componentes };
}

// --- Contexto estruturado para o modelo -----------------------------------
const fmtLic = (l) =>
  `- ${l.id} (${tipoNome(l.sigla)} · órgão ${l.orgao}): validade ${l.validade}, ` +
  `${l._dias != null ? (l._dias < 0 ? `VENCIDA há ${Math.abs(l._dias)} dias` : `vence em ${l._dias} dias`) : 'sem data'}, ` +
  `status ${l.status || '—'}, responsável ${l.resp || '—'}${l.respDet ? ' · ' + l.respDet : ''}`;

const fmtCond = (c) =>
  `- ${c.numero} "${c.nome}" (licença ${c.licenca} · ${c.orgao}): ${c.periodicidade || '—'}, ` +
  `status ${c.statusLabel}, ${c.prog}% concluída, ${c.temEvidencia ? 'COM' : 'SEM'} evidência, ` +
  `${c.temProtocolo ? 'COM' : 'SEM'} protocolo, responsável ${c.resp}`;

const fmtDem = (d) =>
  `- "${d.titulo}" (${d.orgao}): prazo ${d.prazo}, prioridade ${d.prio}, status ${d.status}, responsável ${d.resp}`;

const fmtEvid = (e) =>
  `- "${e.nome}" (${e.tipo}) — licença ${e.lic}, condicionante "${e.cond}", ` +
  `coordenadas ${e.lat}, ${e.lng}, registrada em ${e.data} ${e.hora}, por ${e.resp}`;

/**
 * Monta os blocos de contexto ESCOPADOS à intenção — para o modelo receber só
 * o recorte relevante (e não despejar todo o estado a cada pergunta).
 */
export function buildContext(snap, intencao) {
  const k = snap.kpis;
  const cabecalho =
    `[DATA DE REFERÊNCIA] ${snap.refDate.toLocaleDateString('pt-BR')}\n` +
    `[PORTO DE SUAPE — INDICADORES AMBIENTAIS]\n` +
    `- Licenças: ${k.licencas_total} (vencendo em 30 dias: ${k.licencas_vencendo_30d}; vencidas: ${k.licencas_vencidas})\n` +
    `- Condicionantes: ${k.condicionantes_total} (atrasadas: ${k.condicionantes_atrasadas}; sem evidência: ${k.condicionantes_sem_evidencia}; sem protocolo: ${k.condicionantes_sem_protocolo}; concluídas: ${k.condicionantes_concluidas})\n` +
    `- Demandas: ${k.demandas_abertas} abertas (${k.demandas_criticas} críticas)\n` +
    `- Evidências registradas: ${k.evidencias_total}\n` +
    `- Score de conformidade: ${snap.score.valor}/100 (${snap.score.saude})\n`;

  // Para pedidos analíticos/gerais, fornece o panorama completo; para
  // operacionais, o recorte focado.
  const amplo = intencao === 'resumo_executivo' || intencao === 'relatorio_conformidade' ||
    intencao === 'plano_acao' || intencao === 'pergunta_geral';

  const partes = [cabecalho];
  const lic = amplo ? snap.licencas : snap.vencendo30.concat(snap.vencidas);
  if (lic.length) partes.push('[LICENÇAS]\n' + lic.map(fmtLic).join('\n'));

  const conds = amplo ? snap.conds : snap.condAtrasadas.concat(snap.condSemEvidencia).slice(0, 20);
  if (conds.length) partes.push('[CONDICIONANTES]\n' + conds.map(fmtCond).join('\n'));

  if (amplo && snap.demandas.length) partes.push('[DEMANDAS / PRAZOS]\n' + snap.demandas.map(fmtDem).join('\n'));
  if (amplo && snap.evidencias.length) partes.push('[EVIDÊNCIAS]\n' + snap.evidencias.slice(0, 12).map(fmtEvid).join('\n'));

  return partes.join('\n\n');
}

export default { snapshot, scoreConformidade, flattenCondicionantes, buildContext, tipoNome, parseValidade, diasAteVencimento };
