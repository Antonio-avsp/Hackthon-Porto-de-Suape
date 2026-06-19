// ============================================================
// Repositório ambiental — FONTE ÚNICA DE VERDADE (Fase 3).
//
// Espelha o app/services/finance_context.py do BB: o estado de domínio
// (licenças, condicionantes, demandas, evidências) vive no SERVIDOR, não mais
// volátil no navegador. Assim a "memória" operacional sobrevive a refresh,
// nova sessão e novo dispositivo — todas as sessões leem/escrevem aqui.
//
// Persistência: arquivo JSON (dependency-free, durável). A interface esconde a
// persistência — para usar um banco real (DATABASE_URL), basta reimplementar
// estes métodos sobre o driver escolhido, sem tocar em quem consome.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedState } from '../data/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.ALIA_DATA_FILE || path.join(__dirname, '..', '..', '.data', 'environmental-state.json');
const IN_MEMORY = DATA_FILE === ':memory:';

const clone = (v) => JSON.parse(JSON.stringify(v));

let state = null; // cache em memória

// --- Persistência (arquivo) ------------------------------------------------
function load() {
  if (IN_MEMORY) return seedState();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return {
        licencas: Array.isArray(raw.licencas) ? raw.licencas : [],
        demandas: Array.isArray(raw.demandas) ? raw.demandas : [],
        evidencias: Array.isArray(raw.evidencias) ? raw.evidencias : [],
      };
    }
  } catch {
    /* arquivo corrompido → reseed abaixo */
  }
  const seeded = seedState();
  persist(seeded);
  return seeded;
}

function persist(next) {
  if (IN_MEMORY) return;
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch {
    /* sem disco → mantém só em memória (modo degradado) */
  }
}

function ensure() {
  if (state === null) state = load();
  return state;
}

function save() {
  persist(state);
  return state;
}

// --- Leitura ---------------------------------------------------------------
export function getState() {
  return clone(ensure());
}

// --- Licenças (CRUD granular) ---------------------------------------------
export function addLicenca(lic) {
  const s = ensure();
  const i = s.licencas.findIndex((l) => l.id === lic.id);
  if (i >= 0) s.licencas[i] = { ...s.licencas[i], ...lic };
  else s.licencas.unshift(lic);
  save();
  return clone(lic);
}

export function updateLicenca(id, patch) {
  const s = ensure();
  const i = s.licencas.findIndex((l) => l.id === id);
  if (i < 0) return null;
  s.licencas[i] = { ...s.licencas[i], ...patch };
  save();
  return clone(s.licencas[i]);
}

export function deleteLicenca(id) {
  const s = ensure();
  const antes = s.licencas.length;
  s.licencas = s.licencas.filter((l) => l.id !== id);
  save();
  return s.licencas.length < antes;
}

/**
 * Cria/atualiza a licença a partir de uma extração de IA (por processo+sigla) —
 * espelha upsertFromExtract do frontend, agora persistido no servidor.
 * @returns {{license:object, created:boolean}}
 */
export function upsertFromExtract(d = {}) {
  const s = ensure();
  const cond = (d.cond || []).map((c) => ({ nome: c.descricao || c.nome, per: c.periodicidade || c.per, prog: 0, st: 'pendente' }));
  const i = s.licencas.findIndex((l) => l.processo === d.processo && l.sigla === d.sigla);
  if (i >= 0) {
    s.licencas[i] = { ...s.licencas[i], cond };
    save();
    return { license: clone(s.licencas[i]), created: false };
  }
  const id = d.sigla + '-' + String(d.processo || 'NOVA').replace(/\D/g, '').slice(0, 7);
  const novo = {
    id, sigla: d.sigla, orgao: d.orgao, processo: d.processo, validade: d.validade,
    dias: 7, status: 'critica', resp: 'Equipes internas', respDet: 'IA', cond,
  };
  s.licencas.unshift(novo);
  save();
  return { license: clone(novo), created: true };
}

// --- Demandas / Evidências (replace da coleção) ----------------------------
export function replaceDemandas(arr) {
  const s = ensure();
  s.demandas = Array.isArray(arr) ? arr : [];
  save();
  return clone(s.demandas);
}

export function replaceEvidencias(arr) {
  const s = ensure();
  s.evidencias = Array.isArray(arr) ? arr : [];
  save();
  return clone(s.evidencias);
}

// --- Utilitário (testes / reset administrativo) ----------------------------
export function reset() {
  state = seedState();
  save();
  return getState();
}

export default {
  getState, addLicenca, updateLicenca, deleteLicenca, upsertFromExtract,
  replaceDemandas, replaceEvidencias, reset,
};
