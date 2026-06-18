import React, { useEffect } from 'react';
import Modal from '../components/Modal.jsx';
import { tipoNome, RESP_COR, COR, ST_LABEL } from '../data.js';
import { Icon } from '../icons.jsx';
import { Dot } from '../ui.jsx';
import { useStore } from '../store.jsx';

export default function LicencaDetail({ id }) {
  const { licencas, closeModal, openModal, setScreen, setSelLic, deleteLicenca, toast } = useStore();
  const l = licencas.find((x) => x.id === id);
  useEffect(() => { if (l) setSelLic(l.id); }, [l, setSelLic]);
  if (!l) return null;
  const c = RESP_COR[l.resp] || '#6C757D';
  const valida = l.status !== 'critica';

  return (
    <Modal cls="lic" onClose={closeModal}>
      <div className="lic-detail">
        <div className="ld-head">
          <button className="close ld-close" onClick={closeModal}>×</button>
          <div className="ld-label">Detalhe da licença</div>
          <div className="ld-id">{l.id}</div>
          <div className="ld-sub">{tipoNome(l.sigla)} · {l.orgao}</div>
          <div className="ld-resp"><Dot color={c} />Responsável: {l.resp}{l.respDet ? ' · ' + l.respDet : ''}</div>
          <div className="ld-badge" style={{ background: valida ? '#28A745' : '#DC3545' }}>
            <Icon name="clock" /> {valida ? 'Válida até ' + l.validade : `Vence em ${l.dias} dias — ${l.validade}`}
          </div>
        </div>
        <div className="ld-body">
          <div className="ld-h4">Condicionantes vinculadas</div>
          {l.cond.length ? l.cond.map((cc, i) => (
            <div className="ld-cond" key={i}>
              <Dot color={COR[cc.st]} style={{ marginTop: 6 }} />
              <div><b>{cc.nome}</b><div className="muted" style={{ fontSize: 11.5 }}>{cc.per} · {cc.prog === 100 ? 'concluído' : cc.prog + '%'} · {ST_LABEL[cc.st]}</div></div>
            </div>
          )) : <div className="muted" style={{ fontSize: 12.5 }}>Nenhuma condicionante cadastrada.</div>}
        </div>
        <div className="ld-foot">
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { closeModal(); setScreen('evidencias'); }}><Icon name="evidencias" /> Ver evidências</button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => openModal('historico', l.id)}>Histórico</button>
        </div>
        <div className="ld-foot2">
          <button className="btn btn-ghost btn-sm" onClick={() => openModal('licForm', l.id)}><Icon name="edit" /> Editar</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm('Excluir a licença ' + l.id + '?')) { deleteLicenca(l.id); toast('Licença excluída'); closeModal(); } }}><Icon name="trash" /> Excluir</button>
        </div>
      </div>
    </Modal>
  );
}
