import React from 'react';
import Modal from '../components/Modal.jsx';
import { useStore } from '../store.jsx';
import { flattenCondicionantes, condFilter, condIndicadorLabel } from '../lib/insights.js';
import { StatusTag } from '../ui.jsx';

// Lista as condicionantes correspondentes ao indicador clicado (id = chave).
export default function CondList({ id }) {
  const { licencas, evidencias, closeModal } = useStore();
  const conds = flattenCondicionantes(licencas, evidencias);
  const list = condFilter(conds, id);
  return (
    <Modal onClose={closeModal}>
      <div className="modal-head">
        <h3>Condicionantes · {condIndicadorLabel(id)} ({list.length})</h3>
        <button className="close" onClick={closeModal}>×</button>
      </div>
      <div className="modal-body">
        {list.length ? list.map((c, i) => (
          <div className="cond-row" key={i}>
            <div style={{ flex: 1 }}>
              <b>{c.nome}</b>
              <div className="muted" style={{ fontSize: 11.5 }}>{c.numero} · licença {c.licenca} ({c.orgao}) · {c.periodicidade} · resp. {c.resp}</div>
              <div className="cond-flags">
                <StatusTag st={c.st} />
                <span className="flag" style={{ background: c.temEvidencia ? '#28A7451f' : '#DC35451f', color: c.temEvidencia ? '#28A745' : '#DC3545' }}>{c.temEvidencia ? 'com evidência' : 'sem evidência'}</span>
                <span className="flag" style={{ background: c.temProtocolo ? '#28A7451f' : '#D983241f', color: c.temProtocolo ? '#28A745' : '#D98324' }}>{c.temProtocolo ? 'protocolo enviado' : 'sem protocolo'}</span>
              </div>
            </div>
          </div>
        )) : <div className="muted" style={{ fontSize: 12.5, textAlign: 'center', padding: 20 }}>Nenhuma condicionante neste indicador. ✅</div>}
      </div>
      <div className="modal-foot"><button className="btn btn-ghost" onClick={closeModal}>Fechar</button></div>
    </Modal>
  );
}
