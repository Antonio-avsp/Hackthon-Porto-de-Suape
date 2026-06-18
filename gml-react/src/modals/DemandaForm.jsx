import React, { useState } from 'react';
import Modal from '../components/Modal.jsx';
import { useStore } from '../store.jsx';

const ORGAOS = ['CPRH', 'IBAMA', 'APAC', 'MPF', 'ANTAQ', 'Interno'];

export default function DemandaForm() {
  const { addDemanda, closeModal, toast } = useStore();
  const [f, setF] = useState({ titulo: '', orgao: 'CPRH', resp: '', prazo: '', prio: 'Média', status: 'pendente' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = () => {
    addDemanda({ titulo: f.titulo || 'Nova demanda', orgao: f.orgao, resp: f.resp || '—', prazo: f.prazo || '—', prio: f.prio, status: f.status, tipo: 'Demanda' });
    toast('Demanda cadastrada ✓');
    closeModal();
  };

  return (
    <Modal onClose={closeModal}>
      <div className="modal-head"><h3>Nova demanda / prazo</h3><button className="close" onClick={closeModal}>×</button></div>
      <div className="modal-body">
        <div className="field"><label>Título</label><input value={f.titulo} onChange={set('titulo')} placeholder="Ex.: Esclarecimento sobre efluentes" /></div>
        <div className="row2">
          <div className="field"><label>Órgão</label><select value={f.orgao} onChange={set('orgao')}>{ORGAOS.map((o) => <option key={o}>{o}</option>)}</select></div>
          <div className="field"><label>Responsável</label><input value={f.resp} onChange={set('resp')} placeholder="Ex.: Jurídico" /></div>
        </div>
        <div className="row2">
          <div className="field"><label>Prazo</label><input value={f.prazo} onChange={set('prazo')} placeholder="dd/mm/aaaa" /></div>
          <div className="field"><label>Prioridade</label><select value={f.prio} onChange={set('prio')}><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option></select></div>
        </div>
        <div className="field"><label>Status</label><select value={f.status} onChange={set('status')}><option value="pendente">Pendente</option><option value="andamento">Em andamento</option><option value="concluida">Concluído</option><option value="atrasada">Atrasado</option></select></div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Cadastrar</button>
      </div>
    </Modal>
  );
}
