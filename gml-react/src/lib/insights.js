// ============================================================
// Inteligência sobre os dados da plataforma A.L.I.A.
// - Deriva condicionantes a partir das licenças (modelo enriquecido).
// - Calcula indicadores para o dashboard de condicionantes.
// - Monta o contexto enviado à IA e responde perguntas operacionais
//   diretamente a partir dos dados reais (sem depender da LLM).
// ============================================================
import { tipoNome, ST_LABEL } from '../data.js';

// Uma evidência "cobre" uma condicionante quando está vinculada a ela.
function temEvidenciaPara(cond, evidencias) {
  const alvo = (cond.nome || '').toLowerCase();
  return evidencias.some((e) => (e.cond || '').toLowerCase().includes(alvo) || alvo.includes((e.cond || '').toLowerCase()));
}

// Achata as condicionantes de todas as licenças num modelo rico e auditável.
export function flattenCondicionantes(licencas, evidencias = []) {
  const out = [];
  let n = 0;
  for (const l of licencas) {
    for (const c of (l.cond || [])) {
      n += 1;
      const evidencia = temEvidenciaPara(c, evidencias);
      // Protocolo considerado enviado quando concluída ou com progresso alto.
      const protocolo = c.st === 'concluida' || (c.prog || 0) >= 80;
      out.push({
        numero: `COND-${String(n).padStart(3, '0')}`,
        nome: c.nome,
        licenca: l.id,
        sigla: l.sigla,
        orgao: l.orgao,
        resp: l.resp + (l.respDet ? ' · ' + l.respDet : ''),
        periodicidade: c.per,
        prazo: l.validade,
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

// Indicadores do dashboard de condicionantes. Cada um tem um filtro próprio,
// reutilizado pelo modal de listagem ao clicar.
export const COND_INDICADORES = [
  { key: 'total', label: 'Total', cor: '#2E60AD', pred: () => true },
  { key: 'andamento', label: 'Em andamento', cor: '#2E60AD', pred: (c) => c.st === 'andamento' },
  { key: 'proximas', label: 'Próximas do venc.', cor: '#FCB316', pred: (c) => c.st === 'atencao' },
  { key: 'vencidas', label: 'Vencidas', cor: '#DC3545', pred: (c) => c.st === 'atrasada' || c.st === 'critica' },
  { key: 'concluidas', label: 'Concluídas', cor: '#28A745', pred: (c) => c.st === 'concluida' },
  { key: 'sem_evidencia', label: 'Sem evidência', cor: '#7C5CBF', pred: (c) => !c.temEvidencia },
  { key: 'sem_protocolo', label: 'Sem protocolo', cor: '#D98324', pred: (c) => !c.temProtocolo },
];

export function condIndicadorLabel(key) {
  return (COND_INDICADORES.find((i) => i.key === key) || {}).label || key;
}
export function condFilter(conds, key) {
  const ind = COND_INDICADORES.find((i) => i.key === key) || COND_INDICADORES[0];
  return conds.filter(ind.pred);
}

// ---------- Contexto para a IA (enviado ao backend em perguntas abertas) ----------
export function buildContext(licencas, demandas, conds) {
  const lic = licencas
    .map((l) => `- ${l.id} (${tipoNome(l.sigla)}, órgão ${l.orgao}): validade ${l.validade}, vence em ${l.dias} dias, status ${l.status}, responsável ${l.resp}`)
    .join('\n');
  const cond = conds
    .map((c) => `- ${c.numero} "${c.nome}" (licença ${c.licenca}): ${c.periodicidade}, status ${c.statusLabel}, ${c.temEvidencia ? 'com' : 'SEM'} evidência, ${c.temProtocolo ? 'com' : 'SEM'} protocolo, responsável ${c.resp}`)
    .join('\n');
  const dem = demandas
    .map((d) => `- ${d.titulo} (${d.orgao}): prazo ${d.prazo}, prioridade ${d.prio}, status ${d.status}, responsável ${d.resp}`)
    .join('\n');
  return [
    'Você é o assistente da plataforma A.L.I.A (Automação de Licenças e Inteligência Ambiental).',
    'Responda SEMPRE com base nos dados reais do sistema abaixo. Hoje é 12/06/2025.',
    '\n## LICENÇAS\n' + lic,
    '\n## CONDICIONANTES\n' + cond,
    '\n## DEMANDAS/PRAZOS\n' + dem,
  ].join('\n');
}

// ---------- Respostas locais (a partir dos dados reais, sem LLM) ----------
const li = (s) => `• ${s}`;
const corDias = (d) => (d <= 15 ? '#DC3545' : '#FCB316');

export function responderLocal(text, { licencas, demandas, evidencias, conds }) {
  const q = (text || '').toLowerCase();

  // Licenças que vencem este mês / a vencer
  if (/(licen[çc]a).*(venc|a vencer|este m[eê]s|expir)|quais? licen[çc]as vencem/.test(q)) {
    const venc = licencas.filter((l) => l.dias <= 30).sort((a, b) => a.dias - b.dias);
    if (!venc.length) return 'Nenhuma licença vence nos próximos 30 dias. 👍';
    return `Em junho/2025, <b>${venc.length} licença(s)</b> vencem nos próximos 30 dias:<br>` +
      venc.map((l) => li(`<b>${l.id}</b> (${l.sigla}/${l.orgao}) — vence ${l.validade}, em <b style="color:${corDias(l.dias)}">${l.dias} dias</b>`)).join('<br>');
  }

  // Condicionantes atrasadas / vencidas
  if (/condicionante.*(atrasad|vencid|venc)/.test(q)) {
    const atr = conds.filter((c) => c.st === 'atrasada' || c.st === 'critica');
    if (!atr.length) return 'Nenhuma condicionante atrasada no momento. ✅';
    return `<b>${atr.length} condicionante(s)</b> atrasada(s)/crítica(s):<br>` +
      atr.map((c) => li(`<b>${c.nome}</b> — licença ${c.licenca}, responsável ${c.resp}`)).join('<br>');
  }

  // Condicionantes sem evidência / evidências que faltam (opcionalmente por licença X)
  if (/(evid[êe]ncia).*(falt|pendente|sem)|sem evid[êe]ncia|falta.*evid/.test(q)) {
    const mLic = q.match(/\b([a-z]{2,3}-\d{4}-\d{3})\b/i);
    let sem = conds.filter((c) => !c.temEvidencia);
    if (mLic) sem = sem.filter((c) => c.licenca.toLowerCase() === mLic[1].toLowerCase());
    const escopo = mLic ? ` da licença <b>${mLic[1].toUpperCase()}</b>` : '';
    if (!sem.length) return `Todas as condicionantes${escopo} já possuem evidência vinculada. ✅`;
    return `<b>${sem.length} condicionante(s)</b>${escopo} sem evidência vinculada:<br>` +
      sem.map((c) => li(`<b>${c.nome}</b> — licença ${c.licenca}, responsável ${c.resp}`)).join('<br>');
  }

  // Condicionantes pendentes de protocolo
  if (/condicionante.*protocolo|sem protocolo|protocolo.*pendente/.test(q)) {
    const sem = conds.filter((c) => !c.temProtocolo);
    if (!sem.length) return 'Todas as condicionantes já têm protocolo enviado. ✅';
    return `<b>${sem.length} condicionante(s)</b> sem protocolo enviado:<br>` +
      sem.map((c) => li(`<b>${c.nome}</b> — licença ${c.licenca}`)).join('<br>');
  }

  // Quem é o responsável pela condicionante Y?
  if (/quem.*(respons|responde)|respons[áa]vel/.test(q)) {
    const found = conds.find((c) => q.includes(c.nome.toLowerCase().split(' ').slice(0, 2).join(' ')));
    if (found) return `O responsável pela condicionante <b>${found.nome}</b> (licença ${found.licenca}) é <b>${found.resp}</b>.`;
    return 'Me diga o nome (ou parte) da condicionante para eu localizar o responsável.';
  }

  // Resumo geral
  if (/resumo|panorama|vis[ãa]o geral|status geral/.test(q)) {
    const venc = licencas.filter((l) => l.dias <= 30).length;
    const atr = conds.filter((c) => c.st === 'atrasada' || c.st === 'critica').length;
    const semEv = conds.filter((c) => !c.temEvidencia).length;
    return `<b>Panorama A.L.I.A (12/06/2025)</b><br>` +
      li(`${licencas.length} licenças cadastradas, ${venc} vencendo em 30 dias`) + '<br>' +
      li(`${conds.length} condicionantes, ${atr} atrasada(s), ${semEv} sem evidência`) + '<br>' +
      li(`${demandas.filter((d) => d.status !== 'concluida').length} demandas em aberto`);
  }

  return null; // sem intenção reconhecida → segue para a LLM
}
