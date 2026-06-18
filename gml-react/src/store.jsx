import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { LICENCAS_INICIAIS, DEMANDAS_INICIAIS, EVIDENCIAS_INICIAIS } from './data.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

let toastId = 0;

export function StoreProvider({ children }) {
  const [screen, setScreen] = useState('dashboard');
  const [licencas, setLicencas] = useState(LICENCAS_INICIAIS);
  const [demandas, setDemandas] = useState(DEMANDAS_INICIAIS);
  const [evidencias, setEvidencias] = useState(EVIDENCIAS_INICIAIS);
  const [licFilter, setLicFilter] = useState('all');
  const [pdFilter, setPdFilter] = useState('all');
  const [selLic, setSelLic] = useState('LO-2023-045');
  const [modal, setModal] = useState(null); // { type, payload }
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const openModal = useCallback((type, payload = null) => setModal({ type, payload }), []);
  const closeModal = useCallback(() => setModal(null), []);

  // ---- ações sobre licenças ----
  const addLicenca = useCallback((lic) => {
    setLicencas((l) => [lic, ...l]);
    setSelLic(lic.id);
  }, []);
  const updateLicenca = useCallback((id, patch) => {
    setLicencas((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);
  const deleteLicenca = useCallback((id) => {
    setLicencas((l) => {
      const next = l.filter((x) => x.id !== id);
      setSelLic((cur) => (cur === id ? (next[0] || {}).id : cur));
      return next;
    });
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
    return createdId;
  }, []);

  const addDemanda = useCallback((d) => setDemandas((x) => [d, ...x]), []);
  const deleteDemanda = useCallback((idx) => setDemandas((x) => x.filter((_, i) => i !== idx)), []);

  const addEvidencia = useCallback((nome, lat, lng) => {
    const now = new Date();
    const hora = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    setEvidencias((e) => [
      { nome, tipo: 'Foto de campo', lic: selLic || 'LO-2023-045', cond: 'Registro de campo', resp: 'Marina Alves', data: '12/06/2025', hora, lat, lng },
      ...e,
    ]);
    toast('Evidência registrada com geolocalização ✓');
  }, [selLic, toast]);

  const value = {
    screen, setScreen,
    licencas, addLicenca, updateLicenca, deleteLicenca, upsertFromExtract,
    demandas, addDemanda, deleteDemanda,
    evidencias, addEvidencia,
    licFilter, setLicFilter, pdFilter, setPdFilter,
    selLic, setSelLic,
    modal, openModal, closeModal,
    toasts, toast,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
