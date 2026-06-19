// ============================================================
// Validação e normalização da extração de licenças (Fase 4).
//
// Espelha a filosofia do metas_ia_service.validar_e_normalizar do Banco do
// Brasil: a saída da LLM NUNCA é confiada cegamente. Antes de virar cadastro,
// os dados extraídos são validados e coagidos às regras do domínio ambiental
// (datas plausíveis, órgão conhecido, nº de processo no formato esperado,
// periodicidade canônica, enums válidos) e qualquer ajuste vira um AVISO
// auditável para a interface.
// ============================================================
import env from '../config/env.js';
import { SIGLAS_VALIDAS, RISCOS_VALIDOS, riskColor } from './license.schema.js';

// Órgãos ambientais/intervenientes conhecidos no contexto de Suape.
const ORGAOS_CANONICOS = [
  'CPRH', 'IBAMA', 'APAC', 'ANA', 'MPF', 'MPPE', 'Prefeitura', 'ICMBio',
  'FUNAI', 'IPHAN', 'ANTAQ', 'SEMAS', 'Marinha',
];
const PERIODICIDADES = ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Única', 'Contínua', 'Eventual'];

const semAcento = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Normaliza uma data para DD/MM/AAAA. Aceita vários formatos comuns. */
export function normalizeDate(str) {
  const raw = String(str || '').trim();
  if (!raw || raw === '—') return { value: '—', valid: false, changed: false };
  let d, m, y;
  let mt;
  if ((mt = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(raw))) { [, d, m, y] = mt; }
  else if ((mt = /^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/.exec(raw))) { [, y, m, d] = mt; }
  else return { value: '—', valid: false, changed: true };

  d = Number(d); m = Number(m); y = Number(y);
  const dt = new Date(y, m - 1, d);
  // round-trip valida dia/mês reais (ex.: 31/02 cai fora)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return { value: '—', valid: false, changed: true };
  }
  const value = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  return { value, valid: true, changed: value !== raw, date: dt };
}

/** Mapeia o órgão para a grafia canônica conhecida (ou mantém com aviso). */
export function normalizeOrgao(str) {
  const alvo = semAcento(str).replace(/\s+/g, '');
  const hit = ORGAOS_CANONICOS.find((o) => semAcento(o).replace(/\s+/g, '') === alvo);
  if (hit) return { value: hit, known: true };
  const limpo = String(str || '').trim();
  return { value: limpo || '—', known: false };
}

/** Mapeia a periodicidade para o conjunto canônico (ou mantém com aviso). */
export function normalizePeriodicidade(str) {
  const alvo = semAcento(str);
  const hit = PERIODICIDADES.find((p) => semAcento(p) === alvo);
  if (hit) return { value: hit, known: true };
  const limpo = String(str || '').trim();
  return { value: limpo || '—', known: false };
}

const PROCESSO_RE = /^\d{3,4}\.\d{2,4}\.[A-Z]{2}$/i;

/**
 * Valida e normaliza a licença adaptada (saída de adaptLicenseExtract),
 * devolvendo a versão coerente + a lista de avisos.
 * @param {object} license
 * @returns {{ license: object, validacao: { ok: boolean, avisos: string[] } }}
 */
export function validateAndNormalizeLicense(license = {}) {
  const avisos = [];
  const out = { ...license };

  // Sigla / risco (enums) — reforço (adapt já tratou, mas garantimos coerência).
  if (!SIGLAS_VALIDAS.includes(out.sigla)) { avisos.push(`Sigla "${license.sigla}" não reconhecida — assumido "LO".`); out.sigla = 'LO'; }
  if (!RISCOS_VALIDOS.includes(out.risco)) { out.risco = '—'; }

  // Órgão
  const org = normalizeOrgao(out.orgao);
  if (!org.known && org.value !== '—') avisos.push(`Órgão "${out.orgao}" não está na lista conhecida — confira a grafia.`);
  out.orgao = org.value;

  // Nº do processo
  if (out.processo && out.processo !== '—' && !PROCESSO_RE.test(out.processo.trim())) {
    avisos.push(`Nº de processo "${out.processo}" fora do formato esperado (ex.: 2023.045.PE) — confirme.`);
  }

  // Data de emissão (quando presente)
  if (out.dataEmissao && out.dataEmissao !== '—') {
    const em = normalizeDate(out.dataEmissao);
    if (!em.valid) avisos.push(`Data de emissão "${out.dataEmissao}" inválida — confira.`);
    else { if (em.changed) avisos.push(`Data de emissão normalizada para ${em.value}.`); out.dataEmissao = em.value; }
  }

  // Validade (data) + coerência com a data de referência
  const val = normalizeDate(out.validade);
  if (out.validade && out.validade !== '—' && !val.valid) {
    avisos.push(`Data de validade "${out.validade}" inválida — preencha manualmente.`);
  } else if (val.changed && val.valid) {
    avisos.push(`Data de validade normalizada para ${val.value}.`);
  }
  out.validade = val.value;
  if (val.valid) {
    const ref = parseRef(env.referenceDate);
    if (ref && val.date < ref) avisos.push(`Atenção: validade ${val.value} já está vencida na data de referência (${env.referenceDate}).`);
  }

  // Condicionantes
  out.cond = (Array.isArray(license.cond) ? license.cond : []).map((c, i) => {
    const item = { ...c };
    if (!item.descricao || item.descricao === '—') avisos.push(`Condicionante ${i + 1} sem descrição.`);
    const per = normalizePeriodicidade(item.periodicidade);
    if (!per.known && per.value !== '—') avisos.push(`Periodicidade "${item.periodicidade}" da condicionante ${i + 1} não é canônica.`);
    item.periodicidade = per.value;
    const pz = normalizeDate(item.prazo);
    if (pz.valid) item.prazo = pz.value; // só normaliza se for data; senão mantém (ex.: "Contínua")
    if (!RISCOS_VALIDOS.includes(item.risco)) item.risco = '—';
    item.cor = riskColor(item.risco);
    return item;
  });

  return { license: out, validacao: { ok: avisos.length === 0, avisos } };
}

function parseRef(str) {
  const d = normalizeDate(str);
  return d.valid ? d.date : null;
}

export default { validateAndNormalizeLicense, normalizeDate, normalizeOrgao, normalizePeriodicidade };
