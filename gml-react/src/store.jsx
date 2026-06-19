import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { LICENCAS_INICIAIS, DEMANDAS_INICIAIS, EVIDENCIAS_INICIAIS } from './data.js';
import { fetchEnvState, envApi } from './lib/api.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

let toastId = 0;

// Write-through: persiste no backend (fonte única) sem travar a UI; se o
// servidor estiver offline, segue em modo local (degradado) silenciosamente.
const persist = (p) => { Promise.resolve(p).catch(() => {}); };

export function StoreProvider({ children }) {
  const [screen, setScreen] = useState('dashboard');
  // Estado inicial = seed local (fallback). É substituído pela hidratação do backend no mount.
  const [licencas, setLicencas] = useState(LICENCAS_INICIAIS);
  const [demandas, setDemandas] = useState(DEMANDAS_INICIAIS);
  const [evidencias, setEvidencias] = useState(EVIDENCIAS_INICIAIS);
  const [licFilter, setLicFilter] = useState('all');
  const [pdFilter, setPdFilter] = useState('all');
  const [selLic, setSelLic] = useState('LO-2023-045');
  const [modal, setModal] = useState(null); // { type, payload }
  const [toasts, setToasts] = useState([]);

  // Espelhos para compor o "próximo" array em coleções sem id (demandas/evidências).
  const demandasRef = useRef(demandas);
  const evidenciasRef = useRef(evidencias);
  useEffect(() => { demandasRef.current = demandas; }, [demandas]);
  useEffect(() => { evidenciasRef.current = evidencias; }, [evidencias]);

  // Re-sincroniza o estado a partir do backend (fonte única). Usado no mount e
  // após a automação de ingestão (que grava no servidor, fora do store).
  const reloadState = useCallback(async () => {
    try {
      const s = await fetchEnvState();
      if (!s) return;
      if (Array.isArray(s.licencas)) setLicencas(s.licencas);
      if (Array.isArray(s.demandas)) setDemandas(s.demandas);
      if (Array.isArray(s.evidencias)) setEvidencias(s.evidencias);
    } catch { /* offline → mantém o estado atual */ }
  }, []);

  // Fase 3: hidrata o estado a partir do backend (sobrevive a refresh/nova sessão/
  // dispositivo). Se o backend estiver fora do ar, mantém o seed local.
  useEffect(() => { reloadState(); }, [reloadState]);

  const toast = useCallback((msg) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const openModal = useCallback((type, payload = null) => setModal({ type, payload }), []);
  const closeModal = useCallback(() => setModal(null), []);

  // ---- ações sobre licenças (write-through granular) ----
  const addLicenca = useCallback((lic) => {
    setLicencas((l) => [lic, ...l]);
    setSelLic(lic.id);
    persist(envApi.addLicenca(lic));
  }, []);
  const updateLicenca = useCallback((id, patch) => {
    setLicencas((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    persist(envApi.updateLicenca(id, patch));
  }, []);
  const deleteLicenca = useCallback((id) => {
    setLicencas((l) => {
      const next = l.filter((x) => x.id !== id);
      setSelLic((cur) => (cur === id ? (next[0] || {}).id : cur));
      return next;
    });
    persist(envApi.deleteLicenca(id));
  }, []);
  // Cria ou atualiza a partir de uma extração de IA (por processo+sigla)
  const upsertFromExtract = useCallback((d) => {
    let createdId = null;
    setLicencas((l) => {
      const idx = l.findIndex((x) => x.processo === d.processo && x.sigla === d.sigla);
      const cond = d.cond.map((c) => ({ nome: c.descricao, per: c.periodicidade, prog: 0, st: 'pendente' }));
      if (idx >= 0) {
        createdId = l[idx].id;
        const next = [...l];
        next[idx] = { ...next[idx], cond };
        return next;
      }
      createdId = d.sigla + '-' + String(d.processo || 'NOVA').replace(/\D/g, '').slice(0, 7);
      const novo = { id: createdId, sigla: d.sigla, orgao: d.orgao, processo: d.processo, validade: d.validade, dias: 7, status: 'critica', resp: 'Equipes internas', respDet: 'IA', cond };
      return [novo, ...l];
    });
    if (createdId) setSelLic(createdId);
    persist(envApi.upsertFromExtract(d)); // backend recomputa o mesmo id e persiste
    return createdId;
  }, []);

  // ---- demandas (sem id → replace da coleção) ----
  const addDemanda = useCallback((d) => {
    const next = [d, ...demandasRef.current];
    setDemandas(next);
    persist(envApi.replaceDemandas(next));
  }, []);
  const deleteDemanda = useCallback((idx) => {
    const next = demandasRef.current.filter((_, i) => i !== idx);
    setDemandas(next);
    persist(envApi.replaceDemandas(next));
  }, []);

  const addEvidencia = useCallback((nome, lat, lng) => {
    const now = new Date();
    const hora = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const nova = { nome, tipo: 'Foto de campo', lic: selLic || 'LO-2023-045', cond: 'Registro de campo', resp: 'Marina Alves', data: '12/06/2025', hora, lat, lng };
    const next = [nova, ...evidenciasRef.current];
    setEvidencias(next);
    persist(envApi.replaceEvidencias(next));
    toast('Evidência registrada com geolocalização ✓');
  }, [selLic, toast]);

  const value = {
    screen, setScreen,
    licencas, addLicenca, updateLicenca, deleteLicenca, upsertFromExtract, reloadState,
    demandas, addDemanda, deleteDemanda,
    evidencias, addEvidencia,
    licFilter, setLicFilter, pdFilter, setPdFilter,
    selLic, setSelLic,
    modal, openModal, closeModal,
    toasts, toast,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
