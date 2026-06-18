import React, { useState } from 'react';
import Modal from '../components/Modal.jsx';
import { TIPOS } from '../data.js';
import { useStore } from '../store.jsx';

const ORGAOS = ['CPRH', 'IBAMA', 'APAC', 'MPF', 'ANTAQ'];

export default function LicencaForm({ id }) {
  const { licencas, addLicenca, updateLicenca, closeModal, toast } = useStore();
  const existing = id ? licencas.find((l) => l.id === id) : null;
  const [f, setF] = useState({
    sigla: existing?.sigla || 'LO',
    orgao: existing?.orgao || 'CPRH',
    id: existing?.id || '',
    processo: existing?.processo || '',
    validade: existing?.validade || '',
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = () => {
    const base = { sigla: f.sigla, orgao: f.orgao, processo: f.processo, validade: f.validade };
    if (existing) {
      updateLicenca(existing.id, base);
      toast('Licença atualizada ✓');
    } else {
      addLicenca({ ...base, id: f.id || 'LIC-' + Date.now(), dias: 90, status: 'andamento', resp: 'Equipes internas', respDet: '', cond: [] });
      toast('Licença cadastrada ✓');
    }
    closeModal();
  };

  return (
    <Modal onClose={closeModal}>
      <div className="modal-head"><h3>{existing ? 'Editar licença' : 'Nova licença'}</h3><button className="close" onClick={closeModal}>×</button></div>
      <div className="modal-body">
        <div className="row2">
          <div className="field"><label>Tipo</label><select value={f.sigla} onChange={set('sigla')}>{TIPOS.map((x) => <option key={x.sigla} value={x.sigla}>{x.sigla} — {x.nome}</option>)}</select></div>
          <div className="field"><label>Órgão</label><select value={f.orgao} onChange={set('orgao')}>{ORGAOS.map((o) => <option key={o}>{o}</option>)}</select></div>
        </div>
        <div className="row2">
          <div className="field"><label>Identificador</label><input value={f.id} onChange={set('id')} placeholder="LO-2025-001" /></div>
          <div className="field"><label>Nº do processo</label><input value={f.processo} onChange={set('processo')} placeholder="2025.001.PE" /></div>
        </div>
        <div className="field"><label>Validade</label><input value={f.validade} onChange={set('validade')} placeholder="dd/mm/aaaa" /></div>
        {existing ? (
          <div className="field"><label>Histórico de alterações</label><div className="muted" style={{ fontSize: 12, background: 'var(--suave)', border: '1px solid var(--linha)', borderRadius: 10, padding: 10 }}>Criada em 02/2023 · Última alteração 12/06/2025 por Marina Alves</div></div>
        ) : null}
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>{existing ? 'Salvar alterações' : 'Cadastrar'}</button>
      </div>
    </Modal>
  );
}
