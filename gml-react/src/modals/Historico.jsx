import React from 'react';
import Modal from '../components/Modal.jsx';
import { useStore } from '../store.jsx';

const EV = [
  ['12/06/2025', 'Marina Alves', 'Condicionantes revisadas'],
  ['02/05/2025', 'Sistema', 'Alerta de vencimento gerado'],
  ['15/02/2024', 'J. Costa', 'Cadastro da licença'],
];

export default function Historico({ id }) {
  const { closeModal } = useStore();
  return (
    <Modal onClose={closeModal}>
      <div className="modal-head"><h3>Histórico — {id}</h3><button className="close" onClick={closeModal}>×</button></div>
      <div className="modal-body">
        {EV.map(([d, u, tx], i) => (
          <div style={{ display: 'flex', gap: 12 }} key={i}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--azul)', marginTop: 5, flex: 'none' }} />
            <div><b style={{ fontSize: 13 }}>{tx}</b><div className="muted" style={{ fontSize: 11.5 }}>{d} · {u}</div></div>
          </div>
        ))}
      </div>
      <div className="modal-foot"><button className="btn btn-ghost" onClick={closeModal}>Fechar</button></div>
    </Modal>
  );
}
