import React from 'react';
import { TIPOS, tipoCor, tipoNome } from '../data.js';
import { Icon } from '../icons.jsx';
import { Sigla, RespChip, LicBadge } from '../ui.jsx';
import { useStore } from '../store.jsx';

export default function Licencas() {
  const { licencas, licFilter, setLicFilter, openModal } = useStore();
  const filters = [['all', 'Todas'], ...TIPOS.map((t) => [t.sigla, t.sigla])];
  const list = licencas.filter((l) => licFilter === 'all' || l.sigla === licFilter);

  return (
    <div className="view">
      <div className="card">
        <div className="card-head">
          <div><h3>Licenças &amp; Condicionantes</h3><div className="sub">Filtre por tipo e toque numa licença para abrir o detalhe</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('licForm', null)}>
            <Icon name="plus" /> Nova licença
          </button>
        </div>
        <div className="filters" style={{ marginBottom: 14 }}>
          {filters.map(([k, lb]) => (
            <button key={k} className={'fbtn' + (licFilter === k ? ' on' : '')} onClick={() => setLicFilter(k)}>{lb}</button>
          ))}
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Tipo</th><th>Licença / Órgão</th><th>Responsável</th><th>Validade</th>
              <th style={{ textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? list.map((l) => (
              <tr className="click" key={l.id} onClick={() => openModal('licDetail', l.id)}>
                <td><Sigla sigla={l.sigla} color={tipoCor(l.sigla)} /></td>
                <td><b>{l.id}</b><div className="muted" style={{ fontSize: 11.5 }}>{tipoNome(l.sigla)} · {l.orgao}</div></td>
                <td><RespChip resp={l.resp} respDet={l.respDet} /></td>
                <td>{l.validade}</td>
                <td style={{ textAlign: 'right' }}><LicBadge st={l.status} /></td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 30 }}>Nenhuma licença neste filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
